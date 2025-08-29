import { Check, importDocFromObject } from "../main.js";
import { rules } from "./rules.js";
import resolvedDoc from "./documents/output/doc.json" with {type:'json'};

const doc = await importDocFromObject(resolvedDoc);
if (!doc) process.exit(0);
console.log('all members: ',await doc.allMembers());

doc.useRules(rules);
doc.printAnswer(await doc.isItImplied!('male',['Matt'],Check.byMembership));//outputs false because its not a direct fact