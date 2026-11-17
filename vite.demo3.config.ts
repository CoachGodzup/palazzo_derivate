import { defineConfig } from "vite";

/**
 * Build separata per la demo 03, pubblicata su GitHub Pages come
 * /palazzo_derivate/demo-3/. Il build principale resta nella radice di dist/.
 */
export default defineConfig({
  root: "demo-3",
  base: "./",
  build: {
    outDir: "../dist/demo-3",
    emptyOutDir: true,
    target: "es2022",
  },
  server: {
    host: "0.0.0.0",
    port: 5175,
  },
  preview: {
    host: "0.0.0.0",
    port: 4175,
  },
});
