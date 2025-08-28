import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Doc, importDoc } from "./main.js";

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
const parentDirFromSrc = _dirname.replace('\\build','');

const docFolder = path.join(parentDirFromSrc,'./documents');
const docOutputFolder = path.join(docFolder,'./output');

export async function getFromDocuments(docPath:string):Promise<Doc | undefined> {
    const doc = await importDoc(path.join(docFolder,docPath),docOutputFolder);
    return doc;
}



