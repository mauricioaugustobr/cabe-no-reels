/**
 * cabe-no-reels — estimativa de duração de roteiro.
 *
 * Regra de contagem (transparente e simples):
 *  - cada sequência de caracteres separada por espaço conta como uma palavra;
 *  - tokens sem letra nem número (ex.: "—", "***") são ignorados;
 *  - números contam como uma palavra ("1.350" = 1), então roteiros cheios de
 *    números tendem a sair um pouco mais longos do que o calculado.
 *
 * Duração = (palavras / palavras por minuto) × 60 segundos.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.CabeNoReels = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const MIN_WPM = 80;
  const MAX_WPM = 220;
  const DEFAULT_WPM = 140;
  const DEFAULT_TARGET = 60;
  const TARGETS = [15, 30, 45, 60, 90, 120, 180];

  /** Quantas palavras tem o roteiro. */
  function countWords(text) {
    if (!text) return 0;
    const tokens = String(text).trim().split(/\s+/);
    let total = 0;
    for (const token of tokens) {
      if (/[\p{L}\p{N}]/u.test(token)) total += 1;
    }
    return total;
  }

  /** Duração estimada em segundos. */
  function estimateSeconds(words, wpm) {
    if (!words || !wpm) return 0;
    return (words / wpm) * 60;
  }

  /** Quantas palavras cabem em uma duração alvo. */
  function maxWordsFor(targetSeconds, wpm) {
    if (!targetSeconds || !wpm) return 0;
    return Math.floor((targetSeconds / 60) * wpm);
  }

  /** Classificação do ritmo. */
  function paceLabel(wpm) {
    if (wpm <= 120) return "calmo";
    if (wpm <= 155) return "natural";
    return "acelerado";
  }

  /** "38 s", "1 min 05 s", "2 min". */
  function formatDuration(seconds) {
    const total = Math.max(0, Math.round(seconds));
    if (total < 60) return `${total} s`;
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    if (rest === 0) return `${minutes} min`;
    return `${minutes} min ${String(rest).padStart(2, "0")} s`;
  }

  /**
   * Resultado completo para a interface.
   * diff > 0 sobra tempo; diff < 0 falta tempo.
   */
  function analyze(text, wpm, targetSeconds) {
    const rate = clamp(Number(wpm) || DEFAULT_WPM, MIN_WPM, MAX_WPM);
    const target = Number(targetSeconds) || DEFAULT_TARGET;
    const words = countWords(text);
    const seconds = estimateSeconds(words, rate);
    const diff = target - seconds;
    const capacity = maxWordsFor(target, rate);
    const overflow = Math.max(0, words - capacity);

    return {
      words,
      wpm: rate,
      target,
      seconds,
      diff,
      capacity,
      overflow,
      fits: words > 0 && seconds <= target,
      ratio: target > 0 ? Math.min(seconds / target, 1) : 0,
      pace: paceLabel(rate),
    };
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // ---------------------------------------------------------------- interface

  function init() {
    const $ = (id) => document.getElementById(id);
    const textarea = $("roteiro");
    const wpmInput = $("ritmo");
    const wpmOut = $("ritmo-valor");
    const targetSelect = $("alvo");
    const result = $("resultado");
    const detail = $("detalhe");
    const bar = $("barra");
    const verdict = $("veredito");
    const wordsOut = $("palavras");

    // Estado inicial: URL > localStorage > padrão.
    const params = new URLSearchParams(location.search);
    const saved = readSaved();
    const initialWpm = clamp(
      Number(params.get("rpm")) || saved.wpm || DEFAULT_WPM,
      MIN_WPM,
      MAX_WPM,
    );
    const initialTarget = Number(params.get("alvo")) || saved.target || DEFAULT_TARGET;

    wpmInput.value = String(initialWpm);
    if (!TARGETS.includes(initialTarget)) {
      targetSelect.insertAdjacentHTML(
        "beforeend",
        `<option value="${initialTarget}">${formatDuration(initialTarget)}</option>`,
      );
    }
    targetSelect.value = String(initialTarget);
    textarea.value = params.get("roteiro") || saved.text || "";

    function render() {
      const wpm = Number(wpmInput.value);
      const target = Number(targetSelect.value);
      const text = textarea.value;
      const r = analyze(text, wpm, target);

      wpmOut.textContent = `${wpm} palavras/min (${r.pace})`;
      wordsOut.textContent = `${r.words} ${r.words === 1 ? "palavra" : "palavras"}`;

      if (r.words === 0) {
        result.textContent = "—";
        verdict.textContent = "Cole o roteiro para começar.";
        verdict.dataset.state = "idle";
        detail.textContent = "";
        bar.style.width = "0%";
        bar.dataset.state = "idle";
      } else {
        result.textContent = formatDuration(r.seconds);
        bar.dataset.state = r.fits ? "ok" : "over";

        if (r.fits) {
          const folga = formatDuration(r.diff);
          verdict.textContent = `Cabe: sobram ${folga} de ${formatDuration(r.target)}.`;
          detail.textContent = `Cabem até ${r.capacity} palavras em ${formatDuration(r.target)} nesse ritmo.`;
          bar.style.width = `${Math.min((r.seconds / r.target) * 100, 100)}%`;
        } else {
          const falta = formatDuration(-r.diff);
          verdict.textContent = `Passa do alvo em ${falta}.`;
          detail.textContent = `Corte cerca de ${r.overflow} ${r.overflow === 1 ? "palavra" : "palavras"} (ou ${Math.ceil(r.overflow / r.wpm * 60)} s de fala) para caber em ${formatDuration(r.target)}.`;
          bar.style.width = "100%";
        }
      }

      save({ wpm, target, text });
      const url = new URL(location.href);
      url.searchParams.set("rpm", String(wpm));
      url.searchParams.set("alvo", String(target));
      history.replaceState(null, "", url);
    }

    textarea.addEventListener("input", render);
    wpmInput.addEventListener("input", render);
    targetSelect.addEventListener("change", render);
    render();
  }

  function readSaved() {
    try {
      return JSON.parse(localStorage.getItem("cabe-no-reels") || "{}") || {};
    } catch {
      return {};
    }
  }

  function save(state) {
    try {
      localStorage.setItem("cabe-no-reels", JSON.stringify(state));
    } catch {
      /* modo privado, sem problema */
    }
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  return {
    MIN_WPM,
    MAX_WPM,
    DEFAULT_WPM,
    DEFAULT_TARGET,
    TARGETS,
    countWords,
    estimateSeconds,
    maxWordsFor,
    paceLabel,
    formatDuration,
    analyze,
  };
});
