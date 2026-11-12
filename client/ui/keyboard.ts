import type { VirtualKeyboardLayout } from "mathlive";

export const derivativeKeyboardLayout = {
  id: "derivatives",
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
    ["[(]", "[)]", { latex: "\\frac{#@}{#?}", class: "small" }, "[separator]", "[4]", "[5]", "[6]"],
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

export const virtualKeyboardLayouts = [derivativeKeyboardLayout, "default"] as const;
