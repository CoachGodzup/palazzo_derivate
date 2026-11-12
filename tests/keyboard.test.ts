import { describe, expect, it } from "vitest";
import { derivativeKeyboardLayout, virtualKeyboardLayouts } from "../client/ui/keyboard";

type Keycap = (typeof derivativeKeyboardLayout.rows)[number][number];

function keycapValue(keycap: Keycap): string {
  if (typeof keycap === "string") return keycap;
  const values = keycap as { insert?: string; latex?: string; label?: string };
  return values.insert ?? values.latex ?? values.label ?? "";
}

function keycapValues(): string[] {
  return derivativeKeyboardLayout.rows.flat().map(keycapValue);
}

describe("tastiera delle derivate", () => {
  it("mantiene la tastiera completa come seconda tab", () => {
    expect(virtualKeyboardLayouts[0]).toBe(derivativeKeyboardLayout);
    expect(virtualKeyboardLayouts[1]).toBe("default");
    expect(derivativeKeyboardLayout.label).toBe("Derivate");
  });

  it("offre il tasto x^ che prepara solo l'esponente", () => {
    expect(keycapValues()).toContain("x^{#?}");
  });

  it("offre le funzioni e le costanti richieste", () => {
    const values = keycapValues();
    expect(values).toEqual(
      expect.arrayContaining([
        "\\sin(#?)",
        "\\cos(#?)",
        "\\tan(#?)",
        "\\ln(#?)",
        "\\log(#?)",
        "\\exp(#?)",
        "e",
        "\\pi",
      ]),
    );
  });

  it("raggruppa il tastierino numerico dopo il pannello operazioni", () => {
    const digitRows = derivativeKeyboardLayout.rows
      .map((row) => {
        const values = row.map(keycapValue);
        const separator = values.indexOf("[separator]");
        return values
          .slice(separator + 1)
          .map((value) => value.replace(/^\[(\d)\]$/, "$1"))
          .filter((value) => /^\d$/.test(value))
          .join(",");
      })
      .filter(Boolean);
    expect(digitRows).toEqual(["7,8,9", "4,5,6", "1,2,3", "0"]);
  });

  it("non include simboli estranei alla derivazione", () => {
    const values = keycapValues();
    expect(values).not.toContain("<");
    expect(values).not.toContain(">");
    expect(values).not.toContain("n");
    expect(values.some((value) => value.includes("\\int"))).toBe(false);
  });
});
