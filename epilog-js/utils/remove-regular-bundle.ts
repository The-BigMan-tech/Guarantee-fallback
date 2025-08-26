import fs from 'fs/promises';
await fs.unlink('./dist/bundle.js');
await fs.unlink('./dist/bundle.js.map');
