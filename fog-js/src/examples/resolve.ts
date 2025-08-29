import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { resolveDoc } from "../main.js";

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
const parentDirFromSrc = _dirname.replace('\\build','');

export async function resolveDocument():Promise<void> {
    const filePath = path.join(parentDirFromSrc,'./documents/doc.fog');
    const outputPath = path.join(dirname(filePath),'./output');
    await resolveDoc(filePath,outputPath);
}
await resolveDocument();


