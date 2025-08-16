import { genStruct } from "./analyzer.js";
import { Doc, Rec, Records, Rules } from "./fact-checker.js";

export function runExamples():void {
    const records:Records = {
        friends:new Rec([
            ['ada','ben'],
            ['ben','zane'],
            ['zane','cole'],
            ['cole','matt','jane'],
            ['matt','john']
        ]),
        male:new Rec([
            ['ben'],
            ['john'],
            ['matt']
        ]),
        parent:new Rec([
            ['leo','ben'],
            ['leo','john'],
            ['leo','matt']
        ]),
        eats:new Rec([
            ['ada','meat','pork']
        ]),
    };
    const recordsWithAliases:Records = {
        ...records,
        allies:records.friends
    };
    const facts = `
        'ada' and 'jane' are *friends.
        'jane' and 'cole' are *friends.
        'cole' is a *male.
        'leo' is the *parent of 'ben'.
        'ada' *eats 'meat' and 'pork'.
    `;
    const doc = new Doc(genStruct(facts));
    console.log(Rules.areFriends(doc,['ada','cole']));
    // console.log(Rules.areBrothers(doc,['ben','ben']));

    //this gets all the facts that answers what the widcard can be
    for (const fact of doc.findAllFacts(doc.records.friends,['cole',Doc.wildCard])) {//i used the allies alias
        if (fact) console.log(fact);
    }
    const smallestRecord = doc.selectSmallestRecord(doc.records.male,doc.records.friends,doc.records.parent);
    const candidates = doc.genCandidates(1,smallestRecord,[],new Set());
    for (const [A] of candidates as Generator<string,void,unknown>) {
        if (Rules.areFriends(doc,['ada',A]) && Rules.areBrothers(doc,[A,'ben'])) {
            console.log(A);
        }
    }
    console.log(doc.areMembersInSet(['ada','leo'],doc.records.parent.members.set));

    for (const fact of doc.findAllFacts(doc.records.eats,['ada',Doc.wildCard])) {
        if (fact) console.log(fact);
    }
}
