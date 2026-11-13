import {rename} from 'node:fs/promises';
await rename('dist/app.html','dist/index.html');
