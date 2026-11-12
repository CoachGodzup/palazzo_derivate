import type { VirtualKeyboardLayout } from "mathlive";

export const derivativeKeyboardLayout = {
  id: "derivatives",
  label: "Derivate",
  tooltip: "Tastiera essenziale per le derivate",
  displayEditToolbar: false,
  rows: [
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
