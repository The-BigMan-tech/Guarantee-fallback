import {Info } from "./documents/output/doc.types.js";
import { importDocFromObject, Result } from "fog-js";
import { implications } from "./rules.js";

const resolvedDoc = await import("./documents/output/doc.json",{with:{type:'json'}});
const doc = await importDocFromObject<Info>(resolvedDoc);
if (doc === Result.error) process.exit(0);

doc.useImplications(implications);

const answer1 = await doc.isItStated('membership','friends',["Billy","John"]);
const answer2 = await doc.isItImplied('fallback-exact','brothers',["Matt","Philip"]);//it will return an error if the query statement broke the rule's validation schema

// doc.printAnswer(answer1);
// if (answer2 !== Result.error) doc.printAnswer(answer2);
