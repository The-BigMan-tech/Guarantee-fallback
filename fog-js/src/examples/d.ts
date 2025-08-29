import resolvedDoc from "./documents/output/doc.json" with {type:'json'};
import { rules } from "./rules.js";
import { Check, importDocFromObject } from "../main.js";

const doc = await importDocFromObject(resolvedDoc);
if (!doc) process.exit(0);

doc.useRules(rules);
doc.printAnswer(await doc.isItImplied!('male',['Matt'],Check.byMembership));//outputs false because its not a direct fact