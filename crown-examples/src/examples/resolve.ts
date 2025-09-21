import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { implications } from "./rules.js";
import { setupOutput } from "crown-js";

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
const parentDirFromSrc = _dirname.replace('\\build','');

const srcFilePath = path.join(parentDirFromSrc,'./documents/doc.crown');
const outputPath = path.join(dirname(srcFilePath),'./output');

async function resolveDoc():Promise<void> {
    await setupOutput(srcFilePath,outputPath,implications);
}
await resolveDoc();

