import { readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";

const PRIVATE_PUZZLE_FIELDS = ["function_sympy", "derivative_sympy", "feedback_profile"];
const DEFAULT_LOCALE = "it";

function readJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf8")) as Record<
    string,
    unknown
  >;
}

function generatePublicDemo(): Plugin {
  return {
    name: "generate-public-demo",
    generateBundle() {
      const structure = readJson("./content/demo.json") as {
        version: string;
        puzzles: Record<string, unknown>[];
      };
      const locale = readJson(`./content/locales/${DEFAULT_LOCALE}.json`) as {
        content: {
          chapter: string;
          room: string;
          intro: string;
          outro: string;
          puzzles: Record<string, Record<string, unknown>>;
        };
      };
      const publicDemo = {
        version: structure.version,
        chapter: locale.content.chapter,
        room: locale.content.room,
        intro: locale.content.intro,
        outro: locale.content.outro,
        puzzles: structure.puzzles.map((puzzle) => {
          const pub = {
            ...puzzle,
            ...locale.content.puzzles[String(puzzle.id)],
          };
          for (const field of PRIVATE_PUZZLE_FIELDS) delete pub[field];
          return pub;
        }),
      };
      this.emitFile({
        type: "asset",
        fileName: "demo.json",
        source: JSON.stringify(publicDemo),
      });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [generatePublicDemo()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
  build: {
    target: "es2022",
  },
});
