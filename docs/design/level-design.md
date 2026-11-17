# Level Design — Design

Documento delle decisioni di level design per la **demo-4 Godot 3D** ("La Corte
delle Meridiane"). Descrive il linguaggio visivo (arabo-moresco × steampunk), le
regole di fusione e il workflow Godot per asset, skybox e pavimentazioni. Le
regole di perimetro restano in `AGENTS.md` e in `demo-4/README.md`; la palette di
base è in `docs/design/style.md`.

Stato: **in costruzione** in demo-4. Oggi la scena è interamente procedurale
(`demo-4/scripts/geometry.gd`, `mechanism.gd`, `fountain.gd`, `main.gd`) e CC0
per costruzione; gli asset esterni sono opzionali e soggetti a verifica licenza.

## 1. Linguaggio visivo

L'identità è una **commistione**, non un collage: due vocabolari uniti da regole
esplicite.

### 1.1 Architettura arabo-moresca

- Archi a ferro di cavallo, polilobati e a sesto acuto; iwan (nicchia
  monumentale ad arco).
- Muqarnas (alveoli a stalattite) su nicchie e passaggi.
- Motivi geometrici girih e arabeschi; stelle a 8 punte (khatam); zellige
  (mosaico di maioliche).
- Mashrabiya (griglie lignee traforate) per filtrare luce e viste.
- Riad/sahn: cortile con fontana centrale, colonne slanciate, cupole.
- Materiali: arenaria, intonaco, maiolica smaltata.
- Palette: lapislazzuli/azzurro, turchese, terracotta/arancio, sabbia, oro.

### 1.2 Steampunk

- Ingranaggi in ottone/rame, piastre rivettate, tubature del vapore.
- Manometri a pressione, meccanismi a orologeria, valvole e pistoni.
- Lanterne a gas, bronzo/ottone lucido, vetro e rame.
- Accenti luminosi: ambra calda e bagliori teal/ciano.

### 1.3 Regole di fusione

1. Lo steampunk è il **motore**, il moresco è l'**involucro**: ingranaggi dietro
   una mashrabiya, tubature che seguono l'arco, un manometro incorniciato da
   zellige.
2. Low-poly leggibile: conta più la silhouette del dettaglio fotorealistico.
3. Materiali flat-shaded (`SHADING_MODE_PER_VERTEX`), roughness alta; ottone/oro
   emissivi solo per gli stati attivi o risolti.
4. Colori coerenti con `Geometry.COLORS` e Retro 82 (pietra/avorio, oro
   `#f6c344`, teal `#028391`, arancio `#faa968`).
5. Un solo punto focale per inquadratura; la decorazione non confonde gli
   hotspot dei meccanismi né blocca il camminamento.

## 2. Meccanismi e abbinamento asset

La demo-4 ha quattro meccanismi, ognuno un `kind` in `data/puzzles.json`:

| kind        | Nome                  | Visuale procedurale in `mechanism.gd`     |
| ----------- | --------------------- | ----------------------------------------- |
| `sigil`     | Sigillo Solare        | disco + toro + raggi (emissivo pulsante)  |
| `gears`     | Ingranaggi Gemelli    | due rotori a denti con mozzo emissivo     |
| `hourglass` | Clessidra del Tempo   | bulbi, collo, montanti; ribalta a risolto |
| `gate`      | Porta delle Meridiane | cornice + pannello su pivot che ruota     |

Per sostituire/arricchire una visuale con un modello `.glb`:

1. Copia il file in `demo-4/assets/` e reimporta (`godot --headless --path demo-4 --import`).
2. In `mechanism.gd`, carica il modello e aggiungilo come figlio di `_visual`,
   **senza** toccare collisioni, segnali (`puzzle_requested`, `solved`),
   `mark_solved()`, lampada risolta e pivot di animazione.
3. Se il modello non ha collisione propria, aggiungi un `CollisionShape3D`
   separato che ricalchi la silhouette.

## 3. Skybox

- Default: `ProceduralSkyMaterial` in `main.gd` `_build_environment()`, con
  `BG_SKY` e ambient light da cielo (`AMBIENT_SOURCE_SKY`).
- Alternativa fotografica: `PanoramaSkyMaterial` + HDRI CC0 (Poly Haven),
  sempre `BG_SKY`. Ogni HDRI binario richiede licenza verificata e attribuzione
  in `demo-4/CREDITS.md`.

## 4. Pavimenti e gradini

- Pavimento: griglia di piastrelle (zellige) decorativa sopra un `StaticBody3D`
  piatto unico, così la decorazione non crea micro-urti.
- Gradini: scala riser+tread (alzata ~0.18 m, pedata ~0.30 m), ogni gradino uno
  `static_box`; altezza totale coerente con occhio giocatore (1.6 m) e
  meccanismi (y≈1.4 m).
- Plinto fontana, bordi rialzati, rampe: `StaticBody3D` + `CollisionShape3D`
  allineati alla mesh.
- Il player è una capsula (radius 0.4, height 1.8) con `InteractRay` da 5 m:
  gradini troppo alti o collisioni mancanti rompono movimento e interazione.

## 5. Licenze

- Geometria procedurale = CC0 per costruzione.
- Asset esterni: solo CC0 o licenza verificata; attribuzione in
  `demo-4/CREDITS.md`. Fonti consigliate: KayKit, Quaternius, Kenney (modelli),
  Poly Haven (HDRI), ambientCG (texture PBR).

## 6. Riferimenti

- Script demo-4: `demo-4/scripts/` (`geometry.gd`, `mechanism.gd`, `fountain.gd`, `main.gd`).
- Palette: `docs/design/style.md`.
- GDD direzione artistica: `Il_Palazzo_delle_Derivate_GDD_v1.1.md`.
- Subagente dedicato: `.opencode/agent/level-designer.md`.
