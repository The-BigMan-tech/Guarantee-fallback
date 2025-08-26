import { Doc,importDoc } from "./main.js";
import { rules } from "./rules.js";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
const parentDirFromSrc = _dirname.replace('\\build','');

const doc = await importDoc(path.join(parentDirFromSrc,'./doc.json'));
if (!doc) process.exit(0);

console.info(doc.isItAFact(doc.records.friends,['ada','zane']));//outputs false because its not a direct fact
console.info(rules.areFriends(doc,['ada','zane']));//outputs true out of inference
console.log(rules.areBrothers(doc,['john','jake']));

//This gets all the friends of ada who are also the brother of ben.It selects the smallest record from the ones that are relevant to the context to reduce the number of enumerations required to solve the query to the minimum requirement
const smallestRecord = Doc.selectSmallestRecord(doc.records.male,doc.records.friends);
const candidates = doc.genCandidates(1,smallestRecord,[],new Set());
for (const [A] of candidates as Generator<string,void,unknown>) {
    if (rules.areFriends(doc,['ada',A]) && rules.areBrothers(doc,[A,'ben'])) {
        console.log('The friend of ada who is also the brother of ben:',A);
    }
}