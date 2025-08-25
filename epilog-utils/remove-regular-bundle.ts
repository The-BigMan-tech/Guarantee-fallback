import { unlink } from 'fs/promises';
await unlink('dist\\bundle.js');
await unlink('dist\\bundle.js.map');