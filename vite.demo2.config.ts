import { defineConfig } from "vite";

/**
 * Build separata per la demo 02, pubblicata su GitHub Pages come
 * /palazzo_derivate/demo-2/. Il build principale resta nella radice di dist/.
 */
export default defineConfig({
  root: "demo-2",
  base: "./",
  build: {
    outDir: "../dist/demo-2",
    emptyOutDir: true,
    target: "es2022",
  },
  server: {
    host: "0.0.0.0",
    port: 5174,
  },
  preview: {
    host: "0.0.0.0",
    port: 4174,
  },
});
