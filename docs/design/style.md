# Graphic Style — Design

Documento delle decisioni di stile grafico. Le regole di perimetro restano in `docs/DEMO_SCOPE.md`; questo file descrive la palette colori, gli sfondi e le animazioni visive del gioco.

Stato: **implementato in demo-2 e demo-3**. La demo-2 applica Retro 82 all'interfaccia della campagna (`demo-2/theme.css`); la demo-3 applica la stessa palette alla scena della stanza (`demo-3/theme.css`). La demo-1 mantiene il tema precedente finché non viene migrata.

## 1. Colori — Palette Retro 82

La palette colori principale è tratta da **Retro 82 di Omarchy** (https://omarchy.gallery/themes/retro-82), adattata per l'escape room didattica.

### 1.1 Palette ufficiale Retro 82

| Nome                 | Colore Esadecimale | Note                                            |
| -------------------- | ------------------ | ----------------------------------------------- |
| `background`         | `#05182e`          | Sfondo scuro principale                         |
| `foreground`         | `#f6dcac`          | Testo principale (contrasto 13.4:1)             |
| `accent`             | `#faa968`          | Arancione brillante — usato per elementi attivi |
| `muted`              | `#2a6b78`          | Grigio-azzurro — elementi secondari             |
| `red`                | `#f85525`          | Rosso — errori o attenzione                     |
| `orange`             | `#faa968`          | Arancione — stesso dell'accent                  |
| `yellow`             | `#e97b3c`          | Giallo — richiami, highlight                    |
| `green`              | `#028391`          | Verde — successo, stato attivo                  |
| `cyan`               | `#8cbfb8`          | Turchese — accenti acqua/fluidità               |
| `blue`               | `#3f8f8a`          | Blu notte — meccanismi, elementi                |
| `magenta`            | `#3f8f8a`          | Magenta — presente nella palette originale      |
| `brown`              | `#743d1e`          | Marrone — elementi legno/ottone                 |
| `darker background`  | `#020c17`          | Sfondo più scuro (overlay, profondità)          |
| `dark background`    | `#031222`          | Sfondo secondario                               |
| `lighter background` | `#0a2540`          | Sfondo chiaro (transizioni)                     |

### 1.2 Mappatura applicazione gioco

I token CSS sono definiti nei file di tema dedicati: `demo-2/theme.css` e `demo-3/theme.css`. Ogni file è autosufficiente e importabile da una pagina che usi MathLive o i componenti condivisi di `client/styles.css`.

```css
:root {
  --r82-bg: #05182e; /* sfondo principale */
  --r82-bg-darker: #020c17; /* input, profondità */
  --r82-bg-dark: #031222; /* pannelli laterali */
  --r82-bg-light: #0a2540; /* superfici sollevate, tasti */
  --r82-fg: #f6dcac; /* testo leggibile */
  --r82-accent: #faa968; /* bottoni, focus, elementi attivi */
  --r82-muted: #2a6b78; /* bordi e disabilitati */
  --r82-red: #f85525; /* risposta errata */
  --r82-orange: #faa968; /* sinonimo dell'accento */
  --r82-yellow: #e97b3c; /* attenzione, fine gradiente */
  --r82-green: #028391; /* risposta corretta, bordi e fondi */
  --r82-cyan: #8cbfb8; /* testo di successo e secondario */
  --r82-blue: #3f8f8a; /* meccanismi, profondità */
  --r82-brown: #743d1e; /* legno e ottone */
  --r82-selection: #134e5a; /* selezione del testo */
}
```

I nomi storici del progetto restano disponibili come alias, così i componenti condivisi non vanno riscritti:

| Alias           | Token Retro 82              |
| --------------- | --------------------------- |
| `--night`       | `--r82-bg`                  |
| `--panel`       | `--r82-bg-dark`             |
| `--panel-light` | `--r82-bg-light`            |
| `--gold`        | `--r82-accent`              |
| `--gold-pale`   | `--r82-fg`                  |
| `--muted`       | `--r82-muted`               |
| `--teal`        | `--r82-cyan`                |
| `--line`        | `rgba(250, 169, 104, 0.22)` |

La palette sostituisce la precedente Catppuccin Mocha usata nella demo-2.

### 1.3 Selezione, tastiera e focus

La palette non basta: testo e superfici interattive devono restare leggibili.

- **Selezione del testo**: fondo `#134e5a` con testo `#f6dcac`, sia nell'HTML sia nel campo MathLive. Il valore predefinito di MathLive era quasi bianco con testo chiaro e rendeva il testo evidenziato illeggibile.
- **Tastiera virtuale MathLive**: fondo `--r82-bg-dark`, tasti `--r82-bg-light`, bordo `--r82-muted`, testo `--r82-fg`. Il tasto premuto usa l'arancione `--r82-accent` con testo `--r82-bg-darker`.
- **Focus**: anello giallo-crema `--r82-fg` sui pulsanti e bordo arancione sul contenitore di risposta; il campo MathLive non disegna un secondo riquadro bianco.
- **Stati semantici**: bordo verde `#028391` e testo ciano `#8cbfb8` per il successo; rosso `#f85525` per l'errore. Il colore è sempre accompagnato da testo o icona.

La celebrazione di una stanza risolta usa la stessa palette: runa e alone arancioni, punteggio su fondo verde/ciano; i dettagli di interazione sono in `docs/design/gameplay.md`.

## 2. Sfondi delle stanze

Stato: **implementato in demo-3** con una scena SVG procedurale; nessun asset esterno. Nella demo-2 ogni stanza è una card dell'interfaccia e non ha uno sfondo dedicato.

Ogni stanza dispone di uno **sfondo statico desaturato** che funge da contesto visivo. Lo sfondo è un'immagine fissa (non animata di per sé) che diventa animata al completamento di tutti gli enigmi della stanza.

### 2.1 Specifiche tecniche

- **Formato**: immagine PNG o JPEG, dimensione massima 1920×1080 (viewport desktop), responsive down a 390×844 px portrait. La demo-3 usa invece un SVG procedurale, coerente con il vincolo di non introdurre asset esterni.
- **Desaturazione**: l'immagine originale deve essere convertita in scala di grigi al 100% e poi le luminanze sono ridotte (`opacity` CSS o filtro `saturate(0)`) per ottenere un effetto "desaturated". Questo garantisce che gli elementi a colori (meccanismi, bottoni, testo) risultino ben visibili.
- **Punto focale**: l'immagine deve essere centrata e non contenere elementi critici negli angoli, poiché su mobile la visuale può essere ritagliata.
- **Caricamento**: gli sfondi potranno essere definiti in `content/demo.json` per ogni stanza come URL relativo sotto il campo `backgroundImage`, con caricamento come `background-image` CSS. Oggi la demo-3 genera la scena nel proprio modulo e non legge ancora quel campo.

### 2.2 Comportamento animato al completamento

Quando l'ultimo enigma della stanza è stato risolto (ovvero tutti e 4 gli elementi meccanismo sono stati attivati), lo sfondo passa da statico a animato. L'animazione è definita in CSS/Phaser e può essere una di queste tipologie, a scelta del livello:

| Tipo          | Descrizione                                                                    |
| ------------- | ------------------------------------------------------------------------------ |
| **Fountain**  | Una fontana "spenta" fa fluire l'acqua; particelle luminose seguono il flusso. |
| **Clock**     | L'ago di un orologio ricomincia a girare in senso orario.                      |
| **Gears**     | Ingranaggi che erano fermi riprendono a ruotare lentamente.                    |
| **Particles** | Piccole particelle luminose emergono dal centro dello schermo e si dissolvono. |

Oltre all'animazione dello sfondo, il completamento è reso inequivocabile da un **lampo di luce** (un `radial-gradient` arancio/verde che attraversa l'intera scena) e da un **riepilogo di completamento** a modale (punteggio, tentativi, indizi, tempo). Il lampo parte subito, il riepilogo compare dopo che la scena ha iniziato ad animarsi e la modale dell'enigma si è chiusa: prima la reazione visiva, poi l'esito testuale. Il dettaglio del feedback è in `gameplay.md`, sezione «Completamento della stanza».

L'animazione deve rispettare `prefers-reduced-motion`: in caso di attivazione delle preferenze di sistema, l'animazione si riduce a un cambio di stato statico (es. la fontana diventa "attiva" senza flusso animato, l'orologio salta all'ora corretta). Il lampo di luce e il riepilogo restano presenti perché il completamento è comunicato anche senza movimento.

## 3. Elementi overlay — Meccanismo e Bottone

Stato: **implementato in demo-3** (quattro meccanismi in overlay). La demo-2 continua a usare le card delle stanze.

Sopra ciascuno sfondo, in ogni stanza, sono disposti **quattro elementi in overlay** da sinistra verso destra. Ciascun elemento è composto da:

1. **Meccanismo** — elemento interattivo (ingranaggio, sigillo, valvola, lucchetto, ecc.)
2. **Bottone** — per aprire/esercitare la derivata richiesta

### 3.1 Struttura di ogni overlay

```html
<div class="room-overlay" data-index="0">
  <div class="mechanism" data-solved="false">
    <!-- SVG o sprite del meccanismo -->
    <svg>...</svg>
  </div>
  <button class="mechanism-button" data-enigma="0">
    <span class="mechanism-text">Apri esercizio</span>
    <span class="mechanism-arrow">→</span>
  </button>
</div>
```

- **Posizione**: gli overlay sono posizionati a livello CSS sopra lo sfondo (`position: absolute; inset: 0;`), impilati orizzontalmente con un gap fisso (es. 40 px tra un elemento e l'altro). Ogni elemento occupa circa il 22% della larghezza dello schermo con un margine laterale interno di 20 px.
- **Meccanismo**: può essere un SVG, un sprite sheet o un elemento canvas Phaser. Lo stato `data-solved` cambia da `false` a `true` quando la risposta è corretta.
- **Bottone**: target minimo 44×44 px (accessibilità touch), colora `--color-accent` quando attivo, `--color-muted` quando disabilitato.

### 3.2 Stati del meccanismo

| Stato     | Descrizione CSS/Visivo                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| `idle`    | Meccanismo fermo, aspetto "spento" o statico. Colore `--color-muted`.                                                |
| `solving` | Durante la digitazione della risposta: l'elemento pulsa leggermente (keyframe `pulse-soft` 2s ease-in-out infinite). |
| `solved`  | Dopo la conferma corretta: meccanismo si anima (rotazione, fluido, luce). Colore `--color-success` (`#028391`).      |
| `error`   | Input errato: lo meccanismo mostra un tremolio rosso (`--color-error`) e lo shake orizzontale (300–400 ms).          |

### 3.3 Animazione al completamento di tutti e 4

Quando i 4 meccanismi della stanza hanno `data-solved="true"`, scatta l'animazione di completamento:

1. **Lampo di luce**: un `radial-gradient` attraversa la scena (`.scene-flash`) nel momento in cui l'ultimo meccanismo si attiva, rendendo evidente il risveglio.
2. **Meccanismi scivolano verso il basso**: ciascun elemento `.room-overlay` traslata verticalmente di `translateY(100%)` o `margin-top: 100%` in 500ms ease-out, ritirandosi sotto lo sfondo.
3. **Sfondo si anima**: l'immagine di sfondo passa dall stato desaturated all'animazione scelta (es. fontana che scorre, ingranaggi che girano). L'animazione ha durata 1000–1500ms e gira una sola volta (non infinita).
4. **Riepilogo di completamento**: una modale mostra punteggio, tentativi, indizi e tempo (dettagli in `gameplay.md`).
5. **Porta si sblocca**: dopo l'animazione di completamento, la porta della stanza diventa interattiva e il giocatore può passare alla stanza successiva.

## 4. Flusso visivo della vertical slice (La Corte delle Meridiane)

Stato: **dimostrato in demo-3**. La demo-1 mantiene la scena precedente finché non viene migrata.

Il flusso visivo della vertical slice segue l'ordine: **sigillo → ingranaggi → fontana**. Ciascun dispositivo occupa una posizione nell'overlay a seconda dell'ordine di attivazione:

| Ordine | Dispositivo        | Colore accent primario  | Sfondo associato                                  |
| ------ | ------------------ | ----------------------- | ------------------------------------------------- |
| 1°     | Sigillo solare     | `#faa968` (arancione)   | Sfondo desaturato con motivi geometrici           |
| 2°     | Ingranaggi gemelli | `#3f8f8a` (blu notte)   | Stesso sfondo, elementi overlay spostati a destra |
| 3°     | Fontana del tempo  | `#028391` (verde ciano) | Stesso sfondo, ultimo overlay a destra            |

Al completamento di tutti e 3 (o 4) enigmi, i meccanismi sopra descritti scivolano via e lo sfondo si anima, rivelando la porta finale.

## 5. Accessibilità e reduced-motion

- Tutti gli animazioni devono rispettare la query `prefers-reduced-motion: reduce`. Se attiva:
  - Le particelle e i pulsanti `pulse` sono disabilitati.
  - Gli shake degli errori diventano un cambio istantaneo di posizione (nessun movimento).
  - Le animazioni di completamento (meccanismi che scivolano via, sfondo) diventano cambi di stato immediati (`opacity: 0` / `display: none`).
- Contratto colore: il contrasto tra `--r82-fg` (`#f6dcac`) e `--r82-bg` (`#05182e`) è 13.4:1, sufficiente per WCAG AA anche in modalità scura.
- Target touch minimo 44×44 px per tutti i bottoni meccanismo.
- Testo sempre presente come rinforzo: il colore da solo non comunica stato (es. rosso per errore è affiancato da messaggio testuale).

## 6. Applicazione nelle demo

| Demo   | Ambito                                  | Implementazione                                                  |
| ------ | --------------------------------------- | ---------------------------------------------------------------- |
| demo-1 | Vertical slice, scena Phaser            | Tema precedente, non ancora migrato                              |
| demo-2 | Campagna a 6 capitoli, interfaccia HTML | `demo-2/theme.css`: palette, selezione, tastiera, card, feedback |
| demo-3 | Una stanza con quattro meccanismi       | `demo-3/theme.css` + scena SVG desaturata e animata              |

## 7. Risorse e riferimenti

- Palette originale: https://omarchy.gallery/themes/retro-82
- Token CSS: `demo-2/theme.css` e `demo-3/theme.css`; alias storici in `client/styles.css`
- Feedback e celebrazione: `docs/design/gameplay.md`
- Interfaccia e MathLive: `docs/design/frontend.md`
- Perimetro demo-2: `docs/DEMO_2_SCOPE.md`
- Perimetro demo-3: `docs/DEMO_3_SCOPE.md`
- GDD direzione artistica: `Il_Palazzo_delle_Derivate_GDD_v1.1.md`, sezione 2.1 Direzione artistica
