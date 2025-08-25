import { Doc,Rule,RecursiveRule } from "./fact-checker.js";
import { UniqueList } from "./utils.js";

//A rule is a function that takes a document and a statement and tells if that statement is true from the given facts in the document whether it was explicitly stated or by inference from the rule itself.
export class Rules {//i had the rules as a seprate class to decouple it from the document.So all rules can be added here and be used on whatever document that needs itrather than decoupling specifc rules to the codument class
    public static areDirectFriends:Rule<[string,string]> = (doc,statement)=> {
        const [X,Y] = statement;
        return (//the reason why we are querying only for the first fact cuz we want to know if tey are direct friends or not without caring abut all the facts that makes this true
            doc.isItAFact(doc.records.friends,[X,Y],true)
        );
    };
    public static areIndirectFriends:RecursiveRule<[string,string]> = (doc,statement,visitedCombinations)=> {
        const [X,Y] = statement;
        const candidates = doc.genCandidates<UniqueList<string>,1>(1,doc.records.friends,statement,visitedCombinations);
        for (const [A] of candidates) {
            if (Rules.areDirectFriends(doc,[X,A])) {
                if (Rules.areDirectFriends(doc,[A,Y]) || Rules.areIndirectFriends(doc,[A,Y],visitedCombinations)) {
                    return true;
                }
            }
        }
        return false;
    };
    public static areFriends:Rule<[string,string]> = (doc,statement)=> {
        const areFriends = Rules.areDirectFriends(doc,statement) || Rules.areIndirectFriends(doc,statement,new Set());
        return areFriends;
    };
    public static areSiblings:Rule<[string,string]> = (doc,statement)=> {
        const [X,Y] = statement;
        const parentsOfX = [...doc.findAllFacts(doc.records.parent,[Doc.wildCard,X])]//this is to collect all the facts that answers who the parent of x is
            .map(fact=>{ if (fact!==false) return fact[0]; });//this iterates through each fact to index into the first element to get the parent
        const parentsOfY = [...doc.findAllFacts(doc.records.parent,[Doc.wildCard,Y])]
            .map(fact=>{ if (fact!==false) return fact[0]; });
        const commonParent = Doc.intersection(new Set(parentsOfX),new Set(parentsOfY));
        return Boolean(commonParent.size);
    };
    public static areBrothers:Rule<[string,string]> = (doc,statement) => {
        const [X,Y] = statement;
        if (X === Y) return false;
        const isXMale = doc.isItAFact(doc.records.male,[X]);
        const isYMale = doc.isItAFact(doc.records.male,[Y]);
        if (isXMale && isYMale && Rules.areSiblings(doc,[X,Y])) return true;
        return false;
    };
}