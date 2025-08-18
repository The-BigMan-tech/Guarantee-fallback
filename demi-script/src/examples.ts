import { genStruct } from "./analyzer.js";
import { Doc, Rec,Rule,RecursiveRule} from "./fact-checker.js";

//A rule is a function that takes a document and a statement and tells if that statement is true from the given facts in the document whether it was explicitly stated or by inference from the rule itself.
export class Rules {//i had the rules as a seprate class to decouple it from the document.So all rules can be added here and be used on whatever document that needs itrather than decoupling specifc rules to the codument class
    public static isDirectFriend:Rule<[string,string]> = (doc,statement)=> {
        const [X,Y] = statement;
        return (//the reason why we are querying only for the first fact cuz we want to know if tey are direct friends or not without caring abut all the facts that makes this true
            Boolean(doc.findFirstFact(doc.records.friends,[X,Y],true)) 
        );
    };
    public static isIndirectFriend:RecursiveRule<[string,string]> = (doc,statement,visitedCombinations)=> {
        const [X,Y] = statement;
        const candidates = doc.genCandidates<string[],1>(1,doc.records.friends,statement,visitedCombinations);
        for (const [A] of candidates) {
            if (Rules.isDirectFriend(doc,[X,A])) {
                if (Rules.isDirectFriend(doc,[A,Y]) || Rules.isIndirectFriend(doc,[A,Y],visitedCombinations)) {
                    return true;
                }
            }
        }
        return false;
    };
    public static areFriends:Rule<[string,string]> = (doc,statement)=> {
        const areFriends = Rules.isDirectFriend(doc,statement) || Rules.isIndirectFriend(doc,statement,new Set());
        return areFriends;
    };
    public static sameParent:Rule<[string,string]> = (doc,statement)=> {
        const [X,Y] = statement;
        const parentRec = doc.records.parent;
        const parentFactX =  doc.findFirstFact(parentRec,[Doc.wildCard,X]);
        const parentFactY =  doc.findFirstFact(parentRec,[Doc.wildCard,Y]);
        if (parentFactX && parentFactY) {
            return parentFactX[0] === parentFactY[0];
        }
        return false;
    };
    public static areBrothers:Rule<[string,string]> = (doc,statement) => {
        const [X,Y] = statement;
        if (X === Y) return false;
        const maleRec = doc.records.male;
        const isMaleX = Boolean(doc.findFirstFact(maleRec,[X]));
        const isMaleY = Boolean(doc.findFirstFact(maleRec,[Y]));
        if (isMaleX && isMaleY && Rules.sameParent(doc,[X,Y])) return true;
        return false;
    };
}
export function runExamples():void {
    //Data structure form
    const records:Record<string,Rec> = {
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
    const recordsWithAliases:typeof records = {
        ...records,
        friend:records.friends
    };
    //DSL form
    const facts = `
        let friend = *friends.

        :ada and :peter are *friends.
        :peter is :cole's #friend.
        :ada is *friends with [:jane ,:john ,:boy].
    `;
    const doc = new Doc(genStruct(facts));
    console.log('are they friends: ',Rules.areFriends(doc,['ada','cole']));
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
    console.log(doc.areMembersInSet(['ada','leo'],doc.records.parent.members.set));

    for (const fact of doc.findAllFacts(doc.records.eats,['ada',Doc.wildCard])) {
        if (fact) console.log(fact);
    }
}
