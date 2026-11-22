// Testes: node test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  countWords,
  estimateSeconds,
  maxWordsFor,
  paceLabel,
  formatDuration,
  analyze,
} = require("./app.js");

test("conta palavras ignorando pontuação solta", () => {
  assert.equal(countWords(""), 0);
  assert.equal(countWords("   "), 0);
  assert.equal(countWords("oi"), 1);
  assert.equal(countWords("oi, tudo bem?"), 3);
  assert.equal(countWords("bom — dia *** 123"), 3);
  assert.equal(countWords("linha um\nlinha dois"), 4);
});

test("estima a duração a partir do ritmo", () => {
  assert.equal(estimateSeconds(140, 140), 60);
  assert.equal(estimateSeconds(70, 140), 30);
  assert.equal(estimateSeconds(0, 140), 0);
});

test("calcula quantas palavras cabem", () => {
  assert.equal(maxWordsFor(60, 140), 140);
  assert.equal(maxWordsFor(30, 150), 75);
});

test("classifica o ritmo", () => {
  assert.equal(paceLabel(100), "calmo");
  assert.equal(paceLabel(140), "natural");
  assert.equal(paceLabel(180), "acelerado");
});

test("formata a duração", () => {
  assert.equal(formatDuration(38), "38 s");
  assert.equal(formatDuration(59.6), "1 min");
  assert.equal(formatDuration(65), "1 min 05 s");
  assert.equal(formatDuration(120), "2 min");
});

test("analisa roteiro que cabe", () => {
  const r = analyze("palavra ".repeat(140), 140, 60);
  assert.equal(r.words, 140);
  assert.equal(r.seconds, 60);
  assert.equal(r.fits, true);
  assert.equal(r.overflow, 0);
  assert.equal(r.capacity, 140);
});

test("analisa roteiro que passa e sugere corte", () => {
  const r = analyze("palavra ".repeat(210), 140, 60);
  assert.equal(r.words, 210);
  assert.equal(r.fits, false);
  assert.equal(r.overflow, 70);
  assert.equal(Math.round(-r.diff), 30);
});

test("roteiro vazio não é aprovado", () => {
  const r = analyze("", 140, 60);
  assert.equal(r.words, 0);
  assert.equal(r.fits, false);
});

test("ritmo fora da faixa é limitado", () => {
  assert.equal(analyze("a b c", 10, 60).wpm, 80);
  assert.equal(analyze("a b c", 999, 60).wpm, 220);
});
