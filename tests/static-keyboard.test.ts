import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createDerivativeKeyboardLayout } from "../client/ui/keyboard";
import { createDemoKeyboardLayout } from "../demo-2/keyboard";
import { demoKeyboardLayouts } from "../demo-3/keyboard";

type Rows = ReturnType<typeof createDemoKeyboardLayout>["rows"];

function keycapValue(keycap: Rows[number][number]): string {
  if (typeof keycap === "string") return keycap;
  const values = keycap as { insert?: string; latex?: string; label?: string };
  return values.insert ?? values.latex ?? values.label ?? "";
}

function signature(rows: Rows): string[][] {
  return rows.map((row) => row.map(keycapValue));
}

describe("tastiera delle demo statiche", () => {
  it("resta allineata ai tasti della demo 1", () => {
    expect(signature(createDemoKeyboardLayout().rows)).toEqual(
      signature(createDerivativeKeyboardLayout().rows),
    );
  });

  it("la demo 3 usa la stessa tastiera della demo 2", () => {
    expect(signature(demoKeyboardLayouts()[0].rows)).toEqual(
      signature(createDemoKeyboardLayout().rows),
    );
    expect(demoKeyboardLayouts()[1]).toBe("default");
  });

  it("include le funzioni e le costanti della demo 1", () => {
    const values = createDemoKeyboardLayout().rows.flat().map(keycapValue);
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

  it.each(["demo-2/index.html", "demo-3/index.html"])(
    "%s mostra la funzione con un math-field in sola lettura",
    (file) => {
      const html = readFileSync(file, "utf8");
      expect(html).toContain('id="function-field"');
      expect(html).toContain("read-only");
      expect(html).not.toContain('id="function-display"');
    },
  );
});
