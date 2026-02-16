import {Info } from "./documents/output/doc.types.js";
import { importDocFromObject, Result } from "crown-js";

const resolvedDoc = await import("./documents/output/doc.json",{with:{type:'json'}});
const doc = await importDocFromObject<Info>(resolvedDoc);

if (doc === Result.error) process.exit(0);
const wildcard = await doc.wildCard();

const answer1 = await doc.isItStated('membership','friends',['Leo','Cole'])
console.log(answer1);


const answer2 = await doc.isItStated('exact','mother',['Mandy','Philip'])
console.log(answer1);
