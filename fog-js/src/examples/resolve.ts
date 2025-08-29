import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { importDocFromPath } from "../main.js";
import { genTypes } from "../main.js";
import { rules } from "./rules.js";

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
const parentDirFromSrc = _dirname.replace('\\build','');

const srcFilePath = path.join(parentDirFromSrc,'./documents/doc.fog');
const outputPath = path.join(dirname(srcFilePath),'./output');

export async function resolveDocument():Promise<void> {
    const doc = await importDocFromPath(srcFilePath,outputPath);
    if (doc) await genTypes(doc,path.join(outputPath,'./doc.json'),rules);
}
await resolveDocument();