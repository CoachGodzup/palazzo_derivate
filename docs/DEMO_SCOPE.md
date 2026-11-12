# Demo-1 — Perimetro e criteri di revisione

## Esperienza

**La Corte delle Meridiane** è una vertical slice di 10–15 minuti ambientata nel cortile delle fontane. Il giocatore entra nella corte, osserva la scena fissa e attiva in sequenza tre dispositivi. Ogni soluzione produce una trasformazione concreta: il sigillo si allinea, gli ingranaggi riprendono a ruotare, la fontana torna a scorrere e infine la porta si apre.

Flusso: benvenuto → osservazione → primo sigillo → ingranaggi → fontana → attivazione porta → riepilogo.

## Enigmi

| Dispositivo        | Funzione              | Competenza                     | Forme da accettare                               |
| ------------------ | --------------------- | ------------------------------ | ------------------------------------------------ |
| Sigillo solare     | `3*x^2-5*x+4`         | Potenze e somme                | `6*x-5`, `3*2*x-5`                               |
| Ingranaggi gemelli | `(3*x^2-2)*(x+1)`     | Regola del prodotto            | `9*x^2+6*x-2`, `6*x*(x+1)+3*x^2-2`               |
| Fontana del tempo  | `3*sqrt(x)+2*x^(3/2)` | Radicali e potenze frazionarie | `3/(2*sqrt(x))+3*sqrt(x)`, `(3+6*x)/(2*sqrt(x))` |

Le formule e gli indizi sono in `content/demo.json`; la soluzione attesa è calcolata sul server e non viene inviata al client.

## Sistema di gioco

- Inserimento libero tramite MathLive, con tastiera fisica e virtuale.
- Verifica simbolica FastAPI/SymPy con stati `correct`, `incorrect`, `syntax_error`, `unsupported_expression`.
- Suggerimenti facoltativi progressivi (massimo tre per enigma).
- Massimo 100 punti per enigma: 50 primo tentativo, 25 senza aiuti, 15 senza errori precedenti, 10 entro il tempo indicativo.
- L'esito non blocca mai l'avanzamento; il punteggio non è presentato come misura dell'apprendimento.
- Progresso, tentativi, indizi, tempi e punteggio conservati sul dispositivo. Reset volontario disponibile.
- Animazioni ridotte se richiesto dalle preferenze di sistema.

## Fuori scope

Campagna 32+8 stanze, tutorial sul rapporto incrementale, account, classi, database server, dashboard docente, punteggi online, medaglie definitive, Sabbia del Tempo, PWA e percorso applicativo I Segreti del Tempo.

## Revisione

Controllare l'intero flusso a `http://localhost:5173` su desktop e a 390×844 px. Per ogni enigma provare una risposta corretta equivalente, una errata e una sintassi incompleta. Verificare che:

1. gli oggetti della scena e i pulsanti laterali aprano lo stesso enigma;
2. la tastiera matematica sia utilizzabile su touch;
3. una risposta sbagliata non blocchi il gioco;
4. gli indizi compaiano uno alla volta e incidano sul punteggio;
5. ricaricando la pagina lo stato venga ripristinato;
6. le tre attivazioni abbiano effetti visivi distinti;
7. la porta si apra solo dopo il terzo enigma e compaia il riepilogo;
8. il reset riporti la stanza allo stato iniziale;
9. non vi siano overflow orizzontali o elementi essenziali coperti sul portrait.

Per valutare la demo: chiarezza del ciclo osserva–calcola–attiva, qualità del feedback, leggibilità delle formule, piacevolezza delle reazioni ambientali, fluidità touch e adeguatezza della difficoltà.
