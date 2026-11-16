# Crediti e licenze — Demo 4 (Godot)

## Geometria e codice

Tutta la geometria della scena (stanza, meccanismi, fontana) è generata
**proceduralmente** con primitive di Godot (box, cilindri, sfere, toroidi) e
materiali flat-shaded. Il codice è originale e rilasciato con la licenza del
repository. Non ci sono binari esterni inclusi: il progetto è interamente
testuale e quindi **CC0-compatibile per costruzione**.

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

## HDRI del cielo

Il cielo usa `ProceduralSkyMaterial` (nessun download). Volendo, puoi sostituirlo
con un HDRI CC0 di Poly Haven tramite `PanoramaSkyMaterial`.
