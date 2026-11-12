# Audio — Design

Decisioni sulla musica e sui suoni della demo. Restano valide le regole di perimetro in `docs/DEMO_SCOPE.md` e il vincolo di non introdurre asset esterni senza licenza verificata.

## Musica ambientale

Stato: **implementato** in `client/audio/AmbientMusic.ts`.

La corte usa una musica di sottofondo **procedurale**, generata con la Web Audio API: nessun file audio, nessun asset esterno e nessun peso aggiuntivo nel build.

- Scala **Hijaz** su re (re, mi bemolle, fa diesis, sol, la, si bemolle, do), che dà il colore orientaleggiante senza campioni o registrazioni.
- Melodia lenta a 68 BPM (ottavi), con pause e fioriture occasionali all'ottava.
- Timbro di liuto/oud simulato con oscillatori triangolari e sinusoidali filtrati e inviluppo a pizzico.
- Bordone continuo su re/la/re e percussione leggera di cornice (`dum`/`tek`) con rumore filtrato.
- Volume complessivo contenuto e dissolvenza in ingresso di 2,5 s; il brano non copre i dialoghi né il feedback.

## Controlli e accessibilità

- Pulsante `#audio-button` nella barra superiore, target 44 px, icona `♪` con barra diagonale quando la musica non è attiva.
- `aria-pressed` riflette lo stato **udibile**, non solo la preferenza; etichetta «Attiva la musica» / «Disattiva la musica».
- Preferenza salvata in `localStorage` con chiave `palazzo-derivate:audio` (`on` / `off`); nessun dato personale.
- Default: musica attiva, ma l'avvio richiede un gesto dell'utente (pulsante «Entra nella corte» o il toggle stesso) per rispettare le policy di autoplay dei browser.
- Se il contesto audio non è disponibile o viene rifiutato, il gioco funziona normalmente in silenzio e il pulsante resta in stato disattivato.
- Con la scheda in secondo piano la musica viene sospesa e ripresa al ritorno.
- Il reset della demo ferma la musica, coerentemente con il ritorno alla schermata iniziale.

## Vincoli

- La musica è di sottofondo: non deve mai bloccare input, focus o lettura del testo.
- Non serve per capire l'esito degli enigmi; il feedback resta testuale e visivo.
- Nessun asset audio esterno finché licenza e resa non sono verificate.
