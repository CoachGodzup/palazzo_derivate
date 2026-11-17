import type { VirtualKeyboardLayout } from "mathlive";

/**
 * Tastiera delle derivate per le demo statiche.
 *
 * Deve restare allineata al modello della demo 1 (`client/ui/keyboard.ts`):
 * stesse funzioni, costanti e disposizione. La demo 3 la importa da qui per
 * evitare che le due copie divergano di nuovo. `tests/static-keyboard.test.ts`
 * verifica la parità dei tasti con la demo 1.
 */
export function createDemoKeyboardLayout() {
  return {
    id: "derivatives-demo",
    label: "Derivate",
    tooltip: "Tastiera essenziale per le derivate",
    displayEditToolbar: false,
    rows: [
      [
        { latex: "\\sin", insert: "\\sin(#?)", label: "sin", tooltip: "Seno" },
        { latex: "\\cos", insert: "\\cos(#?)", label: "cos", tooltip: "Coseno" },
        { latex: "\\tan", insert: "\\tan(#?)", label: "tan", tooltip: "Tangente" },
        { latex: "\\ln", insert: "\\ln(#?)", label: "ln", tooltip: "Logaritmo naturale" },
        { latex: "\\log", insert: "\\log(#?)", label: "log", tooltip: "Logaritmo" },
        { latex: "\\exp", insert: "\\exp(#?)", label: "exp", tooltip: "Esponenziale" },
        { latex: "e", label: "e", tooltip: "Numero di Nepero" },
        { latex: "\\pi", label: "π", tooltip: "Pi greco" },
      ],
      [
        { latex: "x", tooltip: "Variabile x" },
        {
          latex: "x^{#?}",
          label: "x^",
          class: "small",
          tooltip: "Potenza di x: scrivi solo l'esponente",
        },
        "\\sqrt{#0}",
        "[separator]",
        "[7]",
        "[8]",
        "[9]",
      ],
      [
        "[(]",
        "[)]",
        { latex: "\\frac{#@}{#?}", class: "small" },
        "[separator]",
        "[4]",
        "[5]",
        "[6]",
      ],
      ["\\times", "[/]", "-", "[separator]", "[1]", "[2]", "[3]"],
      [
        "+",
        "[left]",
        "[right]",
        "[separator]",
        "[0]",
        "[.]",
        { label: "[backspace]", class: "action hide-shift" },
      ],
    ],
  } satisfies VirtualKeyboardLayout;
}

export function demoKeyboardLayouts() {
  return [createDemoKeyboardLayout(), "default"] as const;
}
