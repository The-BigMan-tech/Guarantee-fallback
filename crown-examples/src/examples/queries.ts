import {Info } from "./documents/output/doc.types.js";
import { importDocFromObject, Result } from "crown-js";
import { implications } from "./rules.js";

const resolvedDoc = await import("./documents/output/doc.json",{with:{type:'json'}});
const doc = await importDocFromObject<Info>(resolvedDoc);
if (doc === Result.error) process.exit(0);

doc.useImplications(implications);

const answer1 = await doc.findAllFacts('membership','male',['a','b'])
console.log(answer1);
