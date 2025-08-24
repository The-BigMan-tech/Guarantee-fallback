import { Doc, loadDoc } from "./fact-checker.js";
import { Rules } from "./rules.js";
import path from "path";


const cwd = process.cwd();
const srcPath = path.join(cwd, './src/school.el');
const jsonPath = path.join(
    path.join(cwd, './src'),
    path.basename(srcPath, path.extname(srcPath)) + '.json'
);

const schoolDoc = await loadDoc(srcPath,jsonPath,true);
if (!schoolDoc) process.exit(0);

console.info(schoolDoc.isItAFact(schoolDoc.records.eats,['peter','a']));
console.info(schoolDoc.isItAFact(schoolDoc.records.jh,['a']));
console.log('are they friends: ',Rules.areFriends(schoolDoc,['zane','cole']));
// console.log(Rules.areBrothers(doc,['ben','ben']));

//this gets all the facts that answers what the widcard can be
for (const fact of schoolDoc.findAllFacts(schoolDoc.records.friends,['cole',Doc.wildCard],true)) {//i used the allies alias
    if (fact) console.log('friend of cole:',fact);
}
const smallestRecord = schoolDoc.selectSmallestRecord(schoolDoc.records.male,schoolDoc.records.friends,schoolDoc.records.parent);
const candidates = schoolDoc.genCandidates(1,smallestRecord,[],new Set());
for (const [A] of candidates as Generator<string,void,unknown>) {
    if (Rules.areFriends(schoolDoc,['ada',A]) && Rules.areBrothers(schoolDoc,[A,'ben'])) {
        console.log('The friend of ada who is also the brother of ben:',A);
    }
}
console.log(schoolDoc.areMembersInSet(['ada','leo'],schoolDoc.records.parent?.members.set));

for (const fact of schoolDoc.findAllFacts(schoolDoc.records.eats,['ada',Doc.wildCard])) {
    if (fact) console.log(fact);
}