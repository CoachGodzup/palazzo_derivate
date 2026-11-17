# Crediti e licenze — Demo 4 (Godot)

## Geometria e codice

I **meccanismi** e la **fontana** sono generati in parte proceduralmente
(ingranaggi, clessidra, porta: box, cilindri, sfere, toroidi flat-shaded) e in
parte con modelli del pack CC0 sotto (il sigillo usa la meridiana, la fontana
usa la fontana ottagonale). Il codice è originale e rilasciato con la licenza
del repository.

La **stanza** (pavimento, colonnato, pareti, lanterne, arredi) usa modelli
`.glb` importati da un pack CC0 (vedi sotto): la fisica resta su box di
collisione invisibili procedurali, la geometria visibile è dei modelli. Questa
scelta mantiene intatti camminamento, raggio di interazione e meccanismi.

## Modelli 3D — "Desert Mosque and Madrasa Courtyard" (CC0)

- **Fonte**: [3dassets.dev — Desert Mosque and Madrasa Courtyard](https://3dassets.dev/packs/desert-mosque-and-madrasa-courtyard)
- **Licenza**: CC0 1.0 Universal (nessuna attribuzione richiesta). Geometria
  AI-assisted dichiarata dal fornitore; nessun testo/calligrafia né figurazione
  di persone o animali nel pack.
- **File**: `assets/models/*.glb` (60 modelli, ~12 MB). Ne vengono usati 12:
  pavimentazione, arcata del colonnato, muro di confine, applique, lampada a
  stelo, meridiana (sigillo + prop), fontana ottagonale, cuscini, paravento,
  cassapanca, scrivania bassa e canaletta d'acqua.
- **Conversione**: i modelli originali usano l'estensione `KHR_mesh_quantization`
  che l'importatore glTF di Godot 4.7 non legge. Sono stati dequantizzati con
  `gltf-transform dequantize` prima dell'import, senza alterare geometria o
  materiali.

Il resto del pack (cupole, minareto, mihrab, ipostilo, ecc.) è incluso in
`assets/models/` per usi futuri ma non è istanziato nella scena corrente.

## Palette

I colori sono una palette propria ispirata alla *Retro 82* (documentata in
`docs/design/style.md`) e a una resa "palazzo low-poly" calda (pietra, oro,
teal e arancio). Nessuna risorsa grafica copiata.

## Font

- `assets/fonts/DejaVuSans.ttf` — **DejaVu Sans**, distribuito con la
  *Bitstream Vera License* (libera, permette redistribuzione e modifica).
  Usato come font di default per rendere correttamente i simboli matematici
  (apici `² ³ ⁴ ⁵ ⁻`, radicale `√`, `− · × ÷`).
  Fonte: <https://dejavu-fonts.github.io/>.
- `assets/fonts/DejaVuSerif.ttf` — **DejaVu Serif**, stessa licenza, usato per
  titoli e testi dei pannelli Godot (il popup iniziale) per richiamare il
  serif "Georgia" del tema Retro 82.

## Input matematico (solo Web)

- **MathLive** (MIT) — caricate via CDN (`cdn.jsdelivr.net/npm/mathlive@0.111.4`)
  nell'export Web per l'input `<math-field>` con tastiera virtuale e la resa
  LaTeX della funzione. Non è incluso nel repository: viene scaricato dal
  browser a runtime. Il font DejaVu resta il fallback per il pannello Godot
  (desktop) e per gli apici.

## Librerie CC0 consigliate per sostituire/aumentare i modelli

Se vuoi sostituire le primitive con modelli low-poly veri e propri, queste sono
le fonti CC0 più adatte (importazione nativa `.glb`/`.gltf` in Godot):

| Libreria | Licenza | Note |
| --- | --- | --- |
| [KayKit](https://kaylousberg.itch.io/kaykit-dungeon-remastered) | CC0 | Dungeon/castello low-poly, perfetto per il palazzo (fontana, ingranaggi, porte). |
| [Quaternius](https://quaternius.com) | CC0 | Pack low-poly (città, dungeon, nature). `.glb` già pronti. |
| [Kenney](https://kenney.nl) | CC0 | Pack vari (prototype kit, furniture). |
| [Poly Haven](https://polyhaven.com) | CC0 | HDRI e texture (cielo, materiali PBR). |
| [ambientCG](https://ambientcg.com) | CC0 | Texture PBR (pavimenti, pietra). |

### Come aggiungere un modello

1. Scarica il `.glb`/`.gltf` e mettilo in `demo-4/assets/`.
2. Crea un `MeshInstance3D` che carichi la mesh e sostituisci/aggiungi il nodo
   nella scena (in `main.gd` o in `mechanism.gd`).
3. Verifica la licenza del singolo file e aggiungi l'attribuzione qui.

Godot importa `.glb`/`.gltf` nativamente: nessun passaggio di conversione.

## Texture PBR — ambientCG (CC0)

- **Fonte**: [ambientCG](https://ambientcg.com) — licenza CC0 1.0 (pubblico dominio).
- `assets/textures/Tiles144_*` — arenaria dorata (pavimento): colore + normal map.
- `assets/textures/Bricks084_*` — mattoni arenaria (muro di confine): colore + normal map.
- Applicate via `StandardMaterial3D` (albedo + `normal_enabled`) su pavimento e muro,
  con `SHADING_MODE_PER_VERTEX` e roughness alta. Il bump mapping è dato dalla
  normal map (GL), senza height/displacement.

## Cielo e illuminazione

Il cielo è un **shader sky procedurale** (`assets/shaders/sunset_sky.gdshader`):
tramonto con gradiente caldo (zenit viola → orizzonte ambra) e nuvole fbm
animate, senza texture esterne. È collegato come `ShaderMaterial` al `Sky`
(`BG_SKY`, ambient light da cielo). Il sole è un `DirectionalLight3D` caldo e
basso; nessun HDRI binario incluso.
