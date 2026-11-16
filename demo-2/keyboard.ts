import type { VirtualKeyboardLayout } from "mathlive";

/** Tastiera essenziale per la demo statica, senza dipendenze dal client principale. */
export function createDemoKeyboardLayout(): VirtualKeyboardLayout {
  return {
    id: "derivatives-demo",
    label: "Derivate",
    tooltip: "Tastiera essenziale per le derivate",
    displayEditToolbar: false,
    rows: [
      [
        { latex: "\\sin", insert: "\\sin(#?)", label: "sin", tooltip: "Seno" },
        { latex: "\\cos", insert: "\\cos(#?)", label: "cos", tooltip: "Coseno" },
        { latex: "\\ln", insert: "\\ln(#?)", label: "ln", tooltip: "Logaritmo naturale" },
        { latex: "\\exp", insert: "\\exp(#?)", label: "exp", tooltip: "Esponenziale" },
        { latex: "e", label: "e", tooltip: "Numero di Nepero" },
      ],
      [
        { latex: "x", tooltip: "Variabile x" },
        { latex: "x^{#?}", label: "x^", class: "small", tooltip: "Potenza di x" },
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
  };
}

export function demoKeyboardLayouts(): readonly [VirtualKeyboardLayout, "default"] {
  return [createDemoKeyboardLayout(), "default"];
}
