import { getFromDocuments } from "./import.js";
import { rules } from "./rules.js";

const doc = await getFromDocuments('./documents/doc.fog');
if (!doc) process.exit(0);

doc.useRules(rules);
doc.printAnswer(await doc.isItImplied!('male',['leo']));//outputs false because its not a direct fact
