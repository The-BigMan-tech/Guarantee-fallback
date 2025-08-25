import { Doc,Rule,RecursiveRule } from "./fact-checker.js";
import { UniqueList } from "./utils.js";

//A rule is a function that takes a document and a statement and tells if that statement is true from the given facts in the document whether it was explicitly stated or by inference from the rule itself.
export class Rules {//i had the rules as a seprate class to decouple it from the document.So all rules can be added here and be used on whatever document that needs itrather than decoupling specifc rules to the codument class
    public static isDirectFriend:Rule<[string,string]> = (doc,statement)=> {
        const [X,Y] = statement;
        return (//the reason why we are querying only for the first fact cuz we want to know if tey are direct friends or not without caring abut all the facts that makes this true
            doc.isItAFact(doc.records.friends,[X,Y],true)
        );
    };
    public static isIndirectFriend:RecursiveRule<[string,string]> = (doc,statement,visitedCombinations)=> {
        const [X,Y] = statement;
        const candidates = doc.genCandidates<UniqueList<string>,1>(1,doc.records.friends,statement,visitedCombinations);
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
        const isMaleX = doc.isItAFact(maleRec,[X]);
        const isMaleY = doc.isItAFact(maleRec,[Y]);
        if (isMaleX && isMaleY && Rules.sameParent(doc,[X,Y])) return true;
        return false;
    };
}