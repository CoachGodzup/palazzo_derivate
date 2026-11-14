import type { VirtualKeyboardLayout } from "mathlive";
import { t } from "../i18n";

/**
 * La tastiera viene costruita dopo la scelta della lingua, così etichette e
 * tooltip seguono il catalogo attivo invece di restare fissi all'italiano.
 */
export function createDerivativeKeyboardLayout() {
  return {
    id: "derivatives",
    label: t("keyboard.label"),
    tooltip: t("keyboard.tooltip"),
    displayEditToolbar: false,
    rows: [
      [
        { latex: "\\sin", insert: "\\sin(#?)", label: "sin", tooltip: t("keyboard.sin") },
        { latex: "\\cos", insert: "\\cos(#?)", label: "cos", tooltip: t("keyboard.cos") },
        { latex: "\\tan", insert: "\\tan(#?)", label: "tan", tooltip: t("keyboard.tan") },
        { latex: "\\ln", insert: "\\ln(#?)", label: "ln", tooltip: t("keyboard.ln") },
        { latex: "\\log", insert: "\\log(#?)", label: "log", tooltip: t("keyboard.log") },
        { latex: "\\exp", insert: "\\exp(#?)", label: "exp", tooltip: t("keyboard.exp") },
        { latex: "e", label: "e", tooltip: t("keyboard.e") },
        { latex: "\\pi", label: "π", tooltip: t("keyboard.pi") },
      ],
      [
        { latex: "x", tooltip: t("keyboard.variable") },
        {
          latex: "x^{#?}",
          label: "x^",
          class: "small",
          tooltip: t("keyboard.power"),
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

export function createVirtualKeyboardLayouts(): readonly [
  ReturnType<typeof createDerivativeKeyboardLayout>,
  "default",
] {
  return [createDerivativeKeyboardLayout(), "default"];
}
