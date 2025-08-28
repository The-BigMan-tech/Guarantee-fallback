import { getFromDocuments } from "./import.js";

const doc = await getFromDocuments('./doc.fog');
if (!doc) process.exit(0);

console.info('Fact:',await doc.isItImplied('brothers',['jake','ben']));//outputs false because its not a direct fact