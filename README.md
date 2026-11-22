# cabe-no-reels

**Seu roteiro cabe no Reels? Estime a duração no seu ritmo de fala.**

Cole o roteiro, ajuste o ritmo de fala e a duração alvo. O site mostra em segundos
quanto tempo o texto leva para ser dito e, se passar do limite, quantas palavras
cortar para caber.

- Sem cadastro, sem servidor: o texto nunca sai do seu navegador.
- Arquivo único de HTML + um JS sem dependências — abre direto no navegador.
- Leve, responsivo, acessível e com suporte a tema claro e escuro.

## Como usar

1. Abra o `index.html` no navegador (ou publique em qualquer hospedagem estática).
2. Cole o roteiro na caixa de texto.
3. Escolha o ritmo de fala (80 a 220 palavras por minuto) e a duração alvo
   (15 s a 3 min).
4. Leia o resultado: duração estimada, se cabe, e quantas palavras cortar.

O estado fica salvo no `localStorage` e o ritmo e o alvo vão para a URL
(`?rpm=140&alvo=60`), então dá para compartilhar a configuração.

## Como a conta funciona

```
duração (s) = palavras ÷ palavras por minuto × 60
```

Contagem de palavras: cada sequência separada por espaço conta como uma palavra;
tokens sem letra nem número (`—`, `***`) são ignorados; números contam como uma
palavra só ("1.350" = 1), então roteiros cheios de números tendem a sair um pouco
mais longos do que o calculado.

Pausas, respiros e ênfases não entram na conta. Trate o resultado como uma margem
de ±10% e grave um teste antes de publicar.

Ritmos de referência para português:

| Ritmo     | Palavras/min | Quando usar                          |
| --------- | -----------: | ------------------------------------ |
| Calmo     | até 120      | tutorial, explicação, conteúdo denso |
| Natural   | 121 a 155    | conversa, maioria dos Reels          |
| Acelerado | 156 a 220    | gancho rápido, lista, corte seco     |

## Rodar localmente

```bash
# qualquer servidor estático serve
python3 -m http.server 8080
# abra http://localhost:8080
```

Abrir o arquivo direto (`file://`) também funciona.

## Testes

Os cálculos ficam em `app.js` (usável no navegador e no Node) e são cobertos por
`test.cjs`, usando o test runner nativo do Node (sem dependências):

```bash
node test.cjs
```

## Estrutura

```
index.html   interface e estilos
app.js       contagem, estimativa e estado da tela
test.cjs     testes dos cálculos
LICENSE      MIT
```

## Licença

MIT — use, altere e republique, mantendo o aviso de copyright.
