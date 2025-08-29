import { getFromDocuments } from "./import.js";
import { rules } from "./rules.js";

const doc = await getFromDocuments('./doc.fog');
if (!doc) process.exit(0);

doc.useRules(rules);
const answer = await doc.isItImplied!('friends',['ada','benson']);//outputs false because its not a direct fact
console.log('Answer: ',answer);