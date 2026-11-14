import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import catalog from "../content/locales/it.json";
import demo from "../content/demo.json";

type Json = Record<string, unknown>;

function resolveKey(source: Json, key: string): unknown {
  return key.split(".").reduce<unknown>((value, part) => {
    if (value && typeof value === "object" && part in value) {
      return (value as Json)[part];
    }
    return undefined;
  }, source);
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { recursive: true })
    .filter((entry): entry is string => typeof entry === "string" && entry.endsWith(".ts"))
    .map((entry) => join(directory, entry));
}

describe("catalogo dei testi", () => {
  it("copre tutte le chiavi annotate in index.html", () => {
    const html = readFileSync("index.html", "utf8");
    const keys = [...html.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map((match) => match[1]);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(resolveKey(catalog, key), `chiave mancante: ${key}`).toBeTypeOf("string");
    }
  });

  it("copre tutte le chiavi usate dal client", () => {
    const keys = new Set<string>();
    for (const file of sourceFiles("client")) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(/\bt\(\s*"([^"]+)"/g)) keys.add(match[1]);
    }
    expect(keys.size).toBeGreaterThan(0);
    for (const key of keys) {
      expect(resolveKey(catalog, key), `chiave mancante: ${key}`).toBeTypeOf("string");
    }
  });

  it("tiene allineati gli enigmi di demo.json e del catalogo", () => {
    const structureIds = demo.puzzles.map((puzzle) => puzzle.id).sort();
    const textIds = Object.keys(catalog.content.puzzles).sort();
    expect(textIds).toEqual(structureIds);
    for (const texts of Object.values(catalog.content.puzzles)) {
      expect(texts.hints).toHaveLength(3);
    }
  });
});
