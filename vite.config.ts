import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: mode === "plugin" ? [viteSingleFile()] : [],
  build: {
    outDir: mode === "plugin" ? "figma/dist" : "dist",
    emptyOutDir: true,
  },
}));
