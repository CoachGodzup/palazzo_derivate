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

- **WASD / frecce** — muoversi
- **Mouse** — guardare
- **E** o **clic sinistro** — interagire con un meccanismo
- **Esc** — rilasciare/riprendere il mouse

## Struttura

- `scenes/main.tscn` — scena principale (solo root + script).
- `scripts/main.gd` — composizione della stanza, stato, HUD, persistenza.
- `scripts/player.gd` — controller in prima persona + raggio di interazione.
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
