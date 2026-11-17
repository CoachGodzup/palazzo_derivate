# Demo 4 — La Corte delle Meridiane (Godot 4)

Prototipo 3D **low-poly** in Godot 4: una stanza navigabile (cortile) con quattro
meccanismi fermi e una fontana centrale. Interagendo con un meccanismo compare la
funzione di cui calcolare la derivata; se la risposta è corretta il meccanismo si
anima. Risolti tutti e quattro, la fontana al centro si accende.

## Requisiti

- Godot 4.3+ (testato con 4.7.2) con il **template di export Web** installato.

## Avvio in editor

```bash
godot --path demo-4 --editor        # oppure apri project.godot dall'editor
```

Oppure esegui direttamente la scena:

```bash
godot --path demo-4
```

## Export HTML

```bash
godot --headless --path demo-4 --export-release "Web" ../dist/demo-4/index.html
```

Il risultato finisce in `dist/demo-4/` (coerente con `dist/demo-2/` e `dist/demo-3/`),
pronto per la pubblicazione su GitHub Pages sotto `/demo-4/`.

Per servirlo in locale (i moduli Web richiedono un server HTTP, non `file://`):

```bash
python3 -m http.server 8080 -d dist/demo-4
# poi apri http://localhost:8080
```

## Controlli

Desktop:

- **WASD / frecce** — muoversi
- **Mouse** — guardare
- **E** o **clic sinistro** — interagire con un meccanismo
- **Esc** — rilasciare/riprendere il mouse

Mobile / touch:

- **Stick sinistro (basso a sinistra)** — muoversi (analogico, con zona morta)
- **Stick destro (basso a destra)** — guardare, in modo continuo e analogico
- **Trascina il dito sul resto dello schermo** — guardare rapidamente, come alternativa
- **Pulsante «Interagisci»** — aprire l'esercizio del meccanismo più vicino
  davanti a te (non serve mirare con precisione)
- L'interfaccia di gioco (stick, pulsante, HUD) **sparisce** quando si apre
  il popup della derivata e ricompare alla chiusura.
- In verticale compare l'invito a ruotare il telefono: il gioco è pensato per
  l'orizzontale.

I controlli touch compaiono automaticamente sui dispositivi touch
(`DisplayServer.is_touchscreen_available()`, oppure `pointer: coarse` /
`navigator.maxTouchPoints` sul Web). Per provarli da desktop:

```bash
godot --path demo-4 -- --touch          # editor/native
# Web: aggiungi ?touch=1 all'URL (es. http://localhost:8080/?touch=1)
```

## Test headless

```bash
godot --headless --path demo-4 --script res://tests/test_touch_controls.gd
godot --headless --path demo-4 --script res://tests/test_mobile_controls.gd
godot --headless --path demo-4 --script res://tests/test_interaction.gd
godot --headless --path demo-4 --script res://tests/test_raycast.gd
godot --headless --path demo-4 --script res://tests/test_math_parser.gd
godot --headless --path demo-4 --script res://tests/test_glyphs.gd
```

`test_touch_controls` verifica la mappatura degli stick: spingere in alto muove
in avanti (locale `-Z`), la zona morta resta neutra e l'interfaccia twin-stick
si costruisce senza errori.

## Struttura

- `scenes/main.tscn` — scena principale (solo root + script).
- `scripts/main.gd` — composizione della stanza, stato, HUD, persistenza.
- `scripts/player.gd` — controller in prima persona + raggio di interazione.
- `scripts/mobile_controls.gd` — interfaccia touch (stick sinistro per muoversi,
  stick destro per guardare, drag di riserva, pulsante Interagisci, avviso di
  rotazione).
- `scripts/mechanism.gd` — un meccanismo: visual low-poly procedurale + animazione.
- `scripts/fountain.gd` — la fontana centrale (idle → finale).
- `scripts/puzzle_panel.gd` — UI dell'esercizio (input, indizi, feedback).
- `scripts/math_parser.gd` — parser + verifica **mock** su punti campione.
- `scripts/geometry.gd` — helper per primitive e materiali flat-shaded.
- `data/puzzles.json` — i quattro enigmi (unica fonte dei contenuti).
- `assets/models/*.glb` — modelli CC0 del pack "Desert Mosque and Madrasa
  Courtyard" (pavimento, pareti, lanterne, arredi); vedi `CREDITS.md`.
- `assets/shaders/sunset_sky.gdshader` — cielo procedurale al tramonto (nuvole
  incluse), usato in `main.gd` `_build_environment()`.

## Verifica delle derivate

La verifica è un **mock** locale (normalizzazione + confronto su punti campione),
non un motore simbolico: non usa SymPy. È la stessa scelta della demo-3. Per la
verifica simbolica reale resta la vertical slice demo-1 (FastAPI + SymPy).

## Licenza asset

Vedi [`CREDITS.md`](./CREDITS.md). La geometria è procedurale (nostra, CC0);
per sostituire i modelli con pack CC0 esterni (KayKit, Quaternius, Kenney)
basta aggiungere i file `.glb` in `assets/` e collegarli.
