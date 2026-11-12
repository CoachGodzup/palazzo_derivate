# Gameplay — Design

Documento delle decisioni di game design. Le regole di perimetro restano in `docs/DEMO_SCOPE.md`; questo file descrive come il gioco comunica l'esito delle azioni al giocatore.

## Feedback system v0.2

Stato: **proposta di design**, da implementare senza modificare il resto del gameplay demo-1.

Principio guida: **il feedback positivo deve essere più ricco di quello negativo**. L'errore è un invito a riprovare, non una punizione; la soluzione corretta produce una piccola gratificazione. Il ritmo resta quello di una sessione di 10–15 minuti: niente fuochi d'artificio, niente animazioni che interrompono il flusso.

### 1. Risposta corretta — momento di soddisfazione

La modale non si chiude immediatamente. Per circa **800–1200 ms** il dialogo mostra un breve stato di successo.

Contenuto del feedback:

- messaggio contestuale: «Esatto!» / «La derivata è corretta.» / «Il meccanismo si sta riattivando...»;
- input che diventa brevemente verde;
- piccolo effetto di particelle o scintille;
- suono breve e gradevole, se l'audio è disponibile e non disattivato;
- chiusura automatica della modale al termine dell'animazione.

Vincoli: durata contenuta, nessuna attesa aggiuntiva oltre l'animazione, rispetto di `prefers-reduced-motion` (in quel caso l'animazione si riduce a un cambio di stato e al messaggio testuale) e del muto di sistema. Il successo resta comunicato anche senza audio e senza colore.

### 2. Risposta errata — tremolio dell'input

Feedback immediatamente riconoscibile e breve:

- durata dello shake: **300–400 ms**;
- movimento orizzontale contenuto;
- bordo rosso temporaneo sull'input;
- messaggio d'errore sempre visibile;
- focus riportato sull'input per riprovare subito.

Il colore rosso è solo un rinforzo: **il messaggio testuale deve essere sempre presente**, anche per accessibilità e daltonismo. L'errore non blocca mai l'avanzamento né consuma risorse.

### 3. Errori progressivi ed evidenziazione degli aiuti

La risposta non cambia tra un tentativo e l'altro; cambia il livello di supporto offerto.

| Tentativo | Comportamento                                      |
| --------- | -------------------------------------------------- |
| 1° errore | Shake + messaggio generico                         |
| 2° errore | Shake + suggerimento contestuale                   |
| 3° errore | Shake + evidenziazione del pulsante «Suggerimento» |
| 4° errore | Suggerimento più esplicito                         |

Al terzo errore il pulsante degli aiuti riceve una piccola animazione di richiamo, con testo del tipo «Hai a disposizione un suggerimento». L'apertura **non è forzata**: il suggerimento diventa evidente, ma la decisione resta del giocatore. Gli aiuti restano facoltativi e progressivi, con l'effetto sul punteggio già previsto.

### 4. Feedback specifico per tipo di errore (facoltativo, iterazione successiva)

Se il parser riconosce il tipo di errore con sufficiente affidabilità, il feedback può essere mirato:

| Misconcezione               | Esempio                                          | Messaggio possibile                                                                 |
| --------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Esponente non diminuito     | `3*x^4` derivato come `3*x^3`                    | Hai diminuito l'esponente, ma hai dimenticato di moltiplicare per quello originale. |
| Coefficiente dimenticato    | Termine derivato senza il fattore dell'esponente | Ricorda di moltiplicare per l'esponente originale.                                  |
| Segno sbagliato             | Errore algebrico di segno                        | Controlla i segni dei termini derivati.                                             |
| Risposta non interpretabile | Sintassi incompleta o non valida                 | Controlla la scrittura dell'espressione.                                            |

Regola invariante: il feedback specifico è ammesso **solo** per errori riconosciuti in modo affidabile. In caso contrario si usa il messaggio generico, senza inventare diagnosi didattiche. Il riconoscimento resta lato server (SymPy/parser con whitelist); il client non confronta stringhe né deduce la soluzione.

## Note di implementazione

- Stati server già distinti: `correct`, `incorrect`, `syntax_error`, `unsupported_expression`. Il feedback v0.2 mappa l'animazione e i messaggi su questi stati, senza alterare il contratto API.
- Il messaggio di successo e l'animazione partono solo dopo la conferma del server: nessuna risposta preconfezionata lato client.
- Focus e annunci accessibili: il messaggio di esito va annunciato (regione live) e il focus torna all'input dopo un errore. Il dialogo mantiene il focus nativo.
- Rispetto di `prefers-reduced-motion`: shake, particelle e pulse del pulsante sono sostituiti da cambi di stato statici e dal solo testo.
- Suono opzionale, breve, disattivabile e non necessario per capire l'esito.
- Target touch invariati (≥ 44 px); il pulsante suggerimento evidenziato resta pienamente utilizzabile da tastiera e touch.

## Checklist v0.2

- [ ] Animazione di successo prima della chiusura della modale
- [ ] Shake animation e bordo rosso in caso di errore
- [ ] Evidenziazione del pulsante suggerimento al terzo errore
- [ ] Messaggi contestuali progressivi
- [ ] Supporto per feedback specifici in base al tipo di errore (facoltativo)
