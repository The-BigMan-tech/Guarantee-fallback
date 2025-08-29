import path from "path";
import { genTypes,importDocFromObject } from "../main.js";
import resolvedDoc from "./documents/output/doc.json" with {type:'json'};
import { fileURLToPath } from "url";

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);
const parentDirFromSrc = _dirname.replace('\\build','');

export async function generate():Promise<void> {
    const doc = await importDocFromObject(resolvedDoc);
    const filePath = path.join(parentDirFromSrc,'./documents/doc.fog');
    const outputJsonPath = path.join(path.dirname(filePath),'./output/doc.json');
    if (doc) await genTypes(doc,outputJsonPath);
}
await generate();