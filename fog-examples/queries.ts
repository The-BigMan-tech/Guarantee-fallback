import { getFromDocuments } from "./import";

const doc = await getFromDocuments('./doc.json');
if (!doc) process.exit(0);

console.info('Fact:',await doc.isItImplied('friends',['ada','benson']));//outputs false because its not a direct fact

