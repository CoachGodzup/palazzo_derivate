# Frontend — Design

Decisioni su composizione HTML/TypeScript, Phaser, MathLive e accessibilità. La verifica resta sul server; il client non conosce le soluzioni.

## Tastiera matematica

Stato: **implementato** in `client/ui/keyboard.ts`, configurato da `MathDialog`.

La tastiera virtuale MathLive è organizzata in due gruppi di tab:

1. **Derivate** (prima tab): layout essenziale dedicato agli enigmi demo-1. Il classico tastierino numerico resta raggruppato a destra (7–9, 4–6, 1–3, 0), mentre le operazioni formano un pannello a sinistra con `x`, potenza rapida `x^`, radice, parentesi, frazione, moltiplicazione, divisione, somma, sottrazione, frecce e backspace. Sono esclusi simboli non pertinenti alla derivazione dei polinomi e delle radici, come confronti, `n`, integrali e insiemi. Il pannello di modifica laterale di MathLive è disattivato per ridurre il rumore visivo.
2. **123** e le tab standard MathLive (simboli, lettere, greco): restano disponibili come tastiera completa di fallback, senza perdere funzioni già offerte.

Il tasto `x^` inserisce `x^{#?}`: l'esponente è già pronto e selezionato, quindi il giocatore deve digitare solo il valore. La tastiera fisica continua a funzionare e il valore inviato al server resta `getValue("ascii-math")`.

Vincoli invariati: MathLive resta un elemento HTML dentro il `dialog`, il focus resta nativo, i target touch non scendono sotto 44 px e il layout non introduce overflow sul portrait.
