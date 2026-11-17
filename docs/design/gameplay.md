# Gameplay — Design

Documento delle decisioni di game design. Le regole di perimetro restano in `docs/DEMO_SCOPE.md`; questo file descrive come il gioco comunica l'esito delle azioni al giocatore.

## Feedback system v0.2

Stato: **proposta di design**, da implementare senza modificare il resto del gameplay demo-1.

Principio guida: **il feedback positivo deve essere più ricco di quello negativo**. L'errore è un invito a riprovare, non una punizione; la soluzione corretta produce una piccola gratificazione. Il ritmo resta quello di una sessione di 10–15 minuti: niente fuochi d'artificio, niente animazioni che interrompono il flusso.

### 1. Risposta corretta — momento di soddisfazione

Stato: **implementato nella demo 2**.

La modale non si chiude immediatamente. Dopo la verifica corretta il form mostra lo stato di successo e si apre un dialogo dedicato **«Meccanismo riattivato»** con:

- il nome della stanza;
- i punti ottenuti (`+N punti`);
- il progresso del capitolo oppure l'annuncio del capitolo appena sbloccato;
- il messaggio di fine campagna quando si completa l'ultima stanza.

Il dialogo resta aperto circa **3,2 s** (1,8 s con `prefers-reduced-motion`) e si può chiudere subito con «Torna al palazzo». Al ritorno la card della stanza risolta pulsa con un alone arancione e riceve il focus.

Altri dettagli del feedback:

- il riquadro di successo nel form è più ampio e marcato di quello di errore;
- la runa e il punteggio compaiono con una breve animazione di espansione;
- niente toast duplicato: la celebrazione è il messaggio principale;
- suono breve e gradevole, se l'audio è disponibile e non disattivato (non ancora in demo-2);
- chiusura automatica del dialogo al termine dell'animazione.

Vincoli: durata contenuta, uscita immediata disponibile, rispetto di `prefers-reduced-motion` (in quel caso le animazioni si riducono a cambi di stato e resta il messaggio testuale) e del muto di sistema. Il successo resta comunicato anche senza audio e senza colore.

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

## Completamento della stanza — feedback di successo

Stato: **implementato** nella demo 3 (`demo-3/`), come evoluzione del feedback v0.2.

Il completamento di una stanza non può passare inosservato. Dopo l'ultima risposta corretta, il gioco conferma il traguardo con un segnale inequivocabile e articolato:

- **Lampo di luce**: la scena emette un lampo radiale (arancio/verde) nel momento in cui l'ultimo meccanismo si attiva e lo sfondo torna a colori. È solo un rinforzo visivo, non l'unico canale: rispetta `prefers-reduced-motion` e si riduce a un cambio di stato.
- **Riepilogo di completamento**: una modale mostra «La via è aperta.», il punteggio totale (massimo `100 × numero di meccanismi`), i tentativi totali, gli indizi usati e il tempo attivo. Appare **dopo** che la scena ha iniziato ad animarsi e la modale dell'enigma si è chiusa: il giocatore prima _vede_ la reazione, poi _legge_ l'esito.
- **Statistiche aggregate**: tentativi, indizi e tempo sono sommati sui meccanismi della stanza. Il punteggio resta una misura della partita, non dell'apprendimento (nota di padronanza già presente).

Vincoli invariati:

- Il successo resta comunicato anche senza colore: il testo è sempre presente.
- Il focus si sposta sul pulsante principale del riepilogo quando questo si apre.
- Il riepilogo compare **solo al momento del completamento**, non a ogni reload di una stanza già conclusa (al rientro la scena è già animata, ma non si ripresenta la modale).

## Note di implementazione

- Stati server già distinti: `correct`, `incorrect`, `syntax_error`, `unsupported_expression`. Il feedback v0.2 mappa l'animazione e i messaggi su questi stati, senza alterare il contratto API.
- Il messaggio di successo e l'animazione partono solo dopo la conferma del server: nessuna risposta preconfezionata lato client.
- Un esponente lasciato vuoto (`x^`, `x^{}`, `x^(())` prodotto dal segnaposto di MathLive) viene trattato in correzione come assenza di esponente, non come errore di sintassi.
- Focus e annunci accessibili: il messaggio di esito va annunciato (regione live) e il focus torna all'input dopo un errore. Il dialogo mantiene il focus nativo.
- Rispetto di `prefers-reduced-motion`: shake, particelle e pulse del pulsante sono sostituiti da cambi di stato statici e dal solo testo.
- Suono opzionale, breve, disattivabile e non necessario per capire l'esito.
- La musica di sottofondo è procedurale e si controlla dal pulsante `♪` della barra superiore (vedi `audio.md`); non sostituisce il feedback dell'esito.
- Target touch invariati (≥ 44 px); il pulsante suggerimento evidenziato resta pienamente utilizzabile da tastiera e touch.

## Checklist v0.2

- [ ] Animazione di successo prima della chiusura della modale
- [ ] Shake animation e bordo rosso in caso di errore
- [ ] Evidenziazione del pulsante suggerimento al terzo errore
- [ ] Messaggi contestuali progressivi
- [ ] Supporto per feedback specifici in base al tipo di errore (facoltativo)
