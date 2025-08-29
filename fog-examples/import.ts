import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Doc, importDoc } from "fog-js";

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
const parentDirFromSrc = _dirname.replace('\\build','');

export async function getFromDocuments(docPath:string):Promise<Doc | undefined> {
    const filePath = path.join(parentDirFromSrc,docPath);
    const doc = await importDoc(filePath,path.join(dirname(filePath),'./output'));
    return doc;
}



