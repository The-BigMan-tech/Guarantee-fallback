import { runCLI } from "./resolver/resolver.js";
import { fileURLToPath } from 'url';
export * from "./fact-checker/fact-checker.js";
export * from "./utils/utils.js";

const _filename = fileURLToPath(import.meta.url);
if (process.argv[1] === _filename) {
    runCLI();
}
