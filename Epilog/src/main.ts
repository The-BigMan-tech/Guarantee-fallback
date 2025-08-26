import { runCLI } from "./resolver/resolver.js";
import { fileURLToPath } from 'url';

const _filename = fileURLToPath(import.meta.url);
if (process.argv[1] === _filename) {
    runCLI();
}
