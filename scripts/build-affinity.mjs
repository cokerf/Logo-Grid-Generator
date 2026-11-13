import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { zipSync } from "fflate";
const files = {};
for (const [name, path] of [
  ["Logo-Grid-Generator.js", "affinity/Logo-Grid-Generator.js"],
  ["README.md", "affinity/README.md"],
])
  files[name] = new Uint8Array(await readFile(path));
files["generator.html"] = new TextEncoder().encode(
  (await readFile("index.html", "utf8")).replaceAll(
    "./downloads/",
    "https://logo-grid-generator.netlify.app/downloads/",
  ),
);
const zip = zipSync(files);
await mkdir("downloads", { recursive: true });
await mkdir("dist/downloads", { recursive: true });
await writeFile("downloads/logo-grid-affinity.zip", zip);
await writeFile("dist/downloads/logo-grid-affinity.zip", zip);
await copyFile(
  "figma/logo-grid-figma-plugin.zip",
  "downloads/logo-grid-figma-plugin.zip",
);
await copyFile(
  "figma/logo-grid-figma-plugin.zip",
  "dist/downloads/logo-grid-figma-plugin.zip",
);
console.log("Affinity add-on and Figma downloads are ready.");
