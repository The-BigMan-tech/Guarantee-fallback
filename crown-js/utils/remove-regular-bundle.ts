import fs from 'fs/promises';
await fs.unlink('./dist/bundle.cjs');
await fs.unlink('./dist/bundle.cjs.map');
