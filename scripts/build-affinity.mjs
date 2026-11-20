import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { zipSync } from "fflate";
const source = await readFile("affinity/Logo-Grid-Generator.js", "utf8");
const setup = (await readFile("affinity/setup.html", "utf8")).replace("__SCRIPT_JSON__", JSON.stringify(source).replaceAll("<", "\\u003c"));
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
  ).replaceAll("./affinity.html", "https://logo-grid-generator.netlify.app/affinity.html"),
);
files["START-HERE.html"] = new TextEncoder().encode(setup.replaceAll('href="./"', 'href="generator.html"').replaceAll('./downloads/','https://logo-grid-generator.netlify.app/downloads/').replaceAll('./favicon.ico','https://logo-grid-generator.netlify.app/favicon.ico'));
const zip = zipSync(files);
await mkdir("downloads", { recursive: true });
await mkdir("dist/downloads", { recursive: true });
await writeFile("downloads/logo-grid-affinity.zip", zip);
await writeFile("downloads/logo-grid-affinity-2.1.zip", zip);
await writeFile("dist/downloads/logo-grid-affinity-2.1.zip", zip);
await writeFile("downloads/Logo-Grid-Studio-2.1.js", source);
await writeFile("dist/downloads/Logo-Grid-Studio-2.1.js", source);
await writeFile("dist/affinity.html", setup);
await writeFile("affinity.html", setup);
await writeFile("downloads/Logo-Grid-Generator.js", source);
await writeFile("dist/downloads/Logo-Grid-Generator.js", source);
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
