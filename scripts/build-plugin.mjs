import { build } from "esbuild";
import { rename } from "node:fs/promises";
await build({
  entryPoints: ["code.ts"],
  outfile: "figma/dist/code.js",
  bundle: true,
  target: "es2017",
  format: "iife",
});
await rename("figma/dist/index.html", "figma/dist/ui.html");
console.log("Figma plugin ready: import manifest.json in Figma Desktop.");
