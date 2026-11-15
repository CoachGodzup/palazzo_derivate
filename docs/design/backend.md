# Backend e verifica simbolica — Design

Decisione: **la matematica vive solo sul server**. Il client invia
`getValue("ascii-math")` e riceve uno stato; non confronta stringhe, non
calcola derivate e non conosce la soluzione attesa.

## Perché

Una risposta corretta può essere scritta in molti modi:

- `6x - 5`, `-5 + 6x`, `3·2x - 5`;
- `9x^2 + 6x - 2` oppure `6x(x + 1) + 3x^2 - 2`;
- `3/(2√x) + 3√x`, `(3 + 6x)/(2√x)`, `1.5x^(-0.5) + 3x^(0.5)`.

Il confronto testuale rifiuterebbe forme equivalenti; il campionamento
numerico accetterebbe anche risposte sbagliate che coincidono su pochi punti.
Per questo la verifica usa SymPy e solo SymPy.

## Parser

`server/app/symbolic.py` interpreta l'ASCII Math con un parser a whitelist:

- caratteri ammessi, nomi ammessi (`x`, `sqrt`, `exp`, `ln`, `sin`, `cos`) e
  nessun namespace globale ereditato;
- limiti su lunghezza, nodi, parentesi, cifre, valore assoluto, esponenti e
  numero di funzioni;
- `x^`, `x^{}` e `x^(())` (segnaposto di MathLive) vengono normalizzati come
  assenza di esponente;
- errori distinti: `syntax_error`, `unsupported_expression`, `incorrect`,
  `correct`.

La derivata attesa non è mai letta da `derivative_sympy` né inviata al client:
`expected_derivative` la ricalcola dalla `function_sympy` e la cache resta
sul server.

## Equivalenza

`expressions_equivalent(risposta, attesa)` costruisce la differenza e prova, in
ordine, `expand`, `cancel`, `radsimp`, `ratsimp`, `trigsimp` (solo se compaiono
seno e coseno) e infine `simplify`. La prima semplificazione che dà zero chiude
il confronto. Nessun `force`, nessun campionamento, nessuna soglia numerica.

Prima del confronto i letterali decimali vengono riportati alla frazione esatta
che rappresentano (`0.5` → `1/2`, `1.5` → `3/2`), ricavandola dalla
rappresentazione decimale e non da una tolleranza. Senza questo passaggio
SymPy tratta `x^0.5` come un esponente `Float` distinto da `sqrt(x)` e una
risposta corretta come `3x^0.5 + 3/(2√x)` viene rifiutata anche se identica
alla derivata attesa della fontana (terzo enigma, `c1-fontana`).

Il riconoscimento del solo errore inequivocabile `(fg)' = f'g'` resta separato:
il feedback specifico sulla regola del prodotto viene emesso solo quando la
risposta coincide davvero con quel prodotto di derivate; gli altri errori
ricevono il messaggio generico.

## Test

`server/tests/test_api.py` copre, per la derivata della fontana:

- forme con parentesi prodotte da MathLive (`(3)/(2sqrt(x))+3sqrt(x)`);
- forme con coefficienti ed esponenti decimali (`3x^0.5+3/(2sqrt(x))`,
  `(6*x^1.5+3*sqrt(x))/(2*x)`, `1.5x^(-0.5)+3.0x^(0.5)`);
- una risposta quasi corretta (`+0.001`) che deve restare `incorrect`, per
  evitare che la normalizzazione dei decimali allarghi l'accettazione.

Il test E2E continua a usare il backend reale: lo stub statico
(`client/stub.ts`) resta un ripiego per la demo su GitHub Pages e accetta solo
le forme documentate in `docs/DEMO_SCOPE.md`.
