import { getFromDocuments } from "./import";

const doc = await getFromDocuments('./doc.fog');
if (!doc) process.exit(0);

const wildCard = await doc.wildCard();
console.info('Fact:',await doc.isItImplied('friends',['ada',wildCard]));//outputs false because its not a direct fact

