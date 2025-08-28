import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { importDoc } from "./main.js";
import { getInferrableDoc } from "./rules.js";
import { InferrableDoc } from "./rules.js";

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
const parentDirFromSrc = _dirname.replace('\\build','');

const docFolder = path.join(parentDirFromSrc,'./documents');
const docOutputFolder = path.join(docFolder,'./output');

export async function getFromDocuments(docPath:string):Promise<InferrableDoc | null> {
    const doc = await importDoc(path.join(docFolder,docPath),docOutputFolder);
    if (doc) return getInferrableDoc(doc);
    return null;
}



