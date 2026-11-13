import {build} from 'esbuild';
import {rename,readFile,writeFile,copyFile} from 'node:fs/promises';
import {zipSync} from 'fflate';
await build({entryPoints:['code.ts'],outfile:'figma/dist/code.js',bundle:true,target:'es2017',format:'iife'});
await rename('figma/dist/app.html','figma/dist/ui.html');
// Keep a ready-to-run page for this repository's branch-based GitHub Pages hosting.
await copyFile('figma/dist/ui.html','index.html');
const files={};
for(const path of ['manifest.json','figma/dist/code.js','figma/dist/ui.html'])files[path]=new Uint8Array(await readFile(path));
await writeFile('figma/logo-grid-figma-plugin.zip',zipSync(files));
console.log('Ready: index.html and figma/logo-grid-figma-plugin.zip');
