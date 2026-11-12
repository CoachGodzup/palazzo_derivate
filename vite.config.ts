import { readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";

const PRIVATE_PUZZLE_FIELDS = ["function_sympy", "derivative_sympy", "feedback_profile"];

function generatePublicDemo(): Plugin {
  return {
    name: "generate-public-demo",
    generateBundle() {
      const raw = JSON.parse(
        readFileSync(new URL("./content/demo.json", import.meta.url), "utf8"),
      ) as { puzzles: Record<string, unknown>[] };
      const publicDemo = {
        ...raw,
        puzzles: raw.puzzles.map((puzzle) => {
          const pub = { ...puzzle };
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
