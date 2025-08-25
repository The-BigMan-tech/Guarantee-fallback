import { Doc, getDoc } from "./fact-checker.js";
import { Rules } from "./rules.js";
import path from "path";

const cwd = process.cwd();
const srcPath = path.join(cwd, './src/doc.el');
const jsonPath = path.join(
    path.join(cwd, './src'),
    path.basename(srcPath, path.extname(srcPath)) + '.json'
);

const doc = await getDoc(srcPath,jsonPath,false);
if (!doc) process.exit(0);

console.info(doc.isItAFact(doc.records.friends,['ada','zane']));//outputs false because its not a direct fact
console.info(Rules.areFriends(doc,['ada','zane']));//outputs true out of inference
console.log(Rules.areBrothers(doc,['john','jake']));


const smallestRecord = Doc.selectSmallestRecord(doc.records.male,doc.records.friends);
const candidates = doc.genCandidates(1,smallestRecord,[],new Set());
for (const [A] of candidates as Generator<string,void,unknown>) {
    if (Rules.areFriends(doc,['ada',A]) && Rules.areBrothers(doc,[A,'ben'])) {
        console.log('The friend of ada who is also the brother of ben:',A);
    }
}