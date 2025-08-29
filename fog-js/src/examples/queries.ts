import resolvedDoc from "./documents/output/doc.json" with {type:'json'};
import { members ,queryType} from "./documents/output/doc.types.js";
import { rules } from "./rules.js";
import { Check, importDocFromObject } from "../main.js";


const doc = await importDocFromObject<queryType,members>(resolvedDoc);
if (!doc) process.exit(0);
const wildCard = await doc?.wildCard<members>();//i casted it as any because the wild card isnt a declared member of the type

doc.useRules(rules);
const answer = await doc.isItImplied!('mother',[wildCard,"Susan"],Check.byMembership);
doc.printAnswer(answer);