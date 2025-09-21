import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const config = await jiti.import('./stryker.config.ts');

export default config.default ?? config;