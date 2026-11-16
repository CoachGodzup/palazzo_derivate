# Demo-04 — Una stanza low-poly navigabile (Godot 4)

## Esperienza

La demo 04 è un prototipo in **Godot 4** con export **HTML**, separato dallo stack
principale (Phaser 3 + MathLive + FastAPI + SymPy). Dimostra la stessa idea della
demo-3 — una stanza, quattro meccanismi, completamento → reazione — ma in un mondo
3D low-poly navigabile in prima persona.

URL previsto su GitHub Pages: `https://coachgodzup.github.io/palazzo_derivate/demo-4/`.

Flusso: benvenuto → esplorazione libera → interagisci con un meccanismo (E o clic)
→ calcola la derivata → se corretta il meccanismo si anima → risolti tutti e quattro
→ la fontana centrale si anima.

## Stile grafico

- **Low-poly flat-shaded**: primitive Godot con `SHADING_MODE_PER_VERTEX`, geometria
  procedurale (nessun asset binario incluso).
- **Cortile all'aperto** (La Corte delle Meridiane): pavimento, quattro mura, colonne
  angolari, bracieri emissivi; cielo procedurale visibile.
- Palette calda "palazzo": pietra/avorio, oro, teal `#028391`, arancio `#faa968`,
  acqua `#3fa7c9`.

## Quattro meccanismi

| Meccanismo | kind | Funzione | Derivata attesa | Animazione |
| --- | --- | --- | --- | --- |
| Sigillo Solare | `sigil` | `3x^2 - 5x + 4` | `6x - 5` | pulsa e brilla |
| Ingranaggi Gemelli | `gears` | `(3x^2 - 2)(x + 1)` | `9x^2 + 6x - 2` | ruotano in senso opposto |
| Clessidra del Tempo | `hourglass` | `3*sqrt(x) + 2*x^(3/2)` | `3/(2*sqrt(x)) + 3*sqrt(x)` | si ribalta |
| Porta delle Meridiane | `gate` | `2x^5 - 4x^(-2) + 3` | `10x^4 + 8x^(-3)` | si apre |

La **fontana** è al centro e NON è uno dei quattro enigmi: è la ricompensa finale
(spruzzo d'acqua + bagliore) quando tutti i meccanismi sono risolti.

## Verifica mock

- `scripts/math_parser.gd` tokenizza l'input, inserisce le moltiplicazioni implicite
  (`2x`, `3(x+1)`, `(x+1)(x-1)`), converte in RPN (shunting-yard) e valuta su punti
  campione positivi (`[0.5 … 4.0]`).
- Confronto numerico con tolleranza relativa/assoluta, non verifica simbolica.
  Accetta forme equivalenti non semplificate. **Nessun `eval`**: tutto parsato token
  per token.
- Stati distinti: vuoto, sintassi non valida, formato non supportato, errore di
  dominio, risposta errata.
- Input libero (nessuna scelta multipla), notazione lineare: `x`, `+ - * /`, `^`,
  `sqrt(...)`.

## Progressione e persistenza

- Ordine libero dei quattro meccanismi; nessun game over né blocco.
- Indizi progressivi (tre per meccanismo), facoltativi.
- Progresso salvato in `user://demo4_save.json` (versione `demo-4.0`).

## Fuori scope

Verifica SymPy reale, MathLive, account/classi/dashboard, audio procedurale,
mobile portrait completo (la build punta al desktop; il touch è minimale),
campagna completa.

## Revisione

1. Aprire la scena e muoversi con WASD + mouse.
2. Interagire con un meccanismo: deve aprirsi il pannello con la funzione.
3. Risposta corretta in forma non semplificata → meccanismo animato; errata →
   feedback distinto; sintassi incompleta → stato distinto.
4. Risolti i quattro → la fontana spruzza e brilla.
5. Ripresa dopo reload (persistenza) e indizi progressivi.
6. Export Web: servire `dist/demo-4/` e verificare su browser desktop.
