import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { importDoc } from "fog-js";
import { rules } from "./rules.js";

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
const parentDirFromSrc = _dirname.replace('\\build','');

const doc = await importDoc(path.join(parentDirFromSrc,'./documents/doc.json'));
if (!doc) process.exit(0);

console.info('Fact:',await doc.isItAFact('friends',['philip','ada']));//outputs false because its not a direct fact
console.info('Rule:',await rules.areFriends(doc,['ada','philip']));//outputs true out of inference
console.log('Rule:',await rules.areBrothers(doc,['john','jake']));

//This gets all the friends of ada who are also the brother of ben.It selects the smallest record from the ones that are relevant to the context to reduce the number of enumerations required to solve the query to the minimum requirement
const smallestRecord = await doc.selectSmallestRecord(['male','friends']);
const {candidates} = await doc.genCandidates<string,1>(1,smallestRecord,[],[]);
for (const [A] of candidates) {
    if (await rules.areFriends(doc,['ada',A]) && await rules.areBrothers(doc,[A,'ben'])) {
        console.log('The friend of ada who is also the brother of ben:',A);
    }
}