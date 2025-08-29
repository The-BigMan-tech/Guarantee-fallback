import { genTypes,importDocFromObject } from "../main.js";
import resolvedDoc from "./documents/output/doc.json" with {type:'json'};

export async function generate():Promise<void> {
    const doc = await importDocFromObject(resolvedDoc);
    if (doc) await genTypes(doc,"./documents/output/doc.json");
}
await generate();