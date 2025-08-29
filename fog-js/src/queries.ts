import { getFromDocuments } from "./import.js";
import { rules } from "./rules.js";

const doc = await getFromDocuments('./doc.fog');
if (!doc) process.exit(0);

doc.useRules(rules);
doc.printAnswer(await doc.isItImplied!('friend',['ada','b']));//outputs false because its not a direct fact
