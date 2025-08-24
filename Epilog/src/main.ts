import { Doc } from "./fact-checker.js";
import { readDSLAndOutputJson } from "./resolver.js";
import { Rules } from "./rules.js";
import path from "path";

const cwd = process.cwd();
await readDSLAndOutputJson(path.join(cwd,'./src/school.el'),path.join(cwd,'./src'));

if (!schoolFacts) process.exit(0);
const doc = new Doc(schoolFacts);
console.info( doc.isItAFact(doc.records.tall,['ada']));


console.log('are they friends: ',Rules.areFriends(doc,['zane','cole']));
// console.log(Rules.areBrothers(doc,['ben','ben']));

//this gets all the facts that answers what the widcard can be
for (const fact of doc.findAllFacts(doc.records.friends,['cole',Doc.wildCard],true)) {//i used the allies alias
    if (fact) console.log('friend of cole:',fact);
}
const smallestRecord = doc.selectSmallestRecord(doc.records.male,doc.records.friends,doc.records.parent);
const candidates = doc.genCandidates(1,smallestRecord,[],new Set());
for (const [A] of candidates as Generator<string,void,unknown>) {
    if (Rules.areFriends(doc,['ada',A]) && Rules.areBrothers(doc,[A,'ben'])) {
        console.log('The friend of ada who is also the brother of ben:',A);
    }
}
console.log(doc.areMembersInSet(['ada','leo'],doc.records.parent?.members.set));

for (const fact of doc.findAllFacts(doc.records.eats,['ada',Doc.wildCard])) {
    if (fact) console.log(fact);
}