import { Doc,Rule,RecursiveRule } from "./fact-checker.js";
import { UniqueList } from "./utils.js";

interface Rules {
    areDirectFriends:Rule<[string,string]>,
    areIndirectFriends:RecursiveRule<[string,string]>,
    areFriends:Rule<[string,string]>,
    areSiblings:Rule<[string,string]>,
    areBrothers:Rule<[string,string]>
}
export const rules:Rules = {//A rule is a function that takes a document and a statement and tells if that statement is true from the given facts in the document whether it was explicitly stated or by inference from the rule itself.
    areDirectFriends:(doc,statement)=> {
        const [X,Y] = statement;
        return (//the reason why its querying only for the first fact cuz we want to know if tey are direct friends or not without caring abut all the facts that makes this true
            doc.isItAFact(doc.records.friends,[X,Y],true)
        );
    },
    areIndirectFriends:(doc,statement,visitedCombinations)=> {
        const [X,Y] = statement;
        const candidates = doc.genCandidates<UniqueList<string>,1>(1,doc.records.friends,statement,visitedCombinations);
        for (const [A] of candidates) {
            if (rules.areDirectFriends(doc,[X,A])) {
                if (rules.areDirectFriends(doc,[A,Y]) || rules.areIndirectFriends(doc,[A,Y],visitedCombinations)) {
                    return true;
                }
            }
        }
        return false;
    },
    areFriends:(doc,statement)=> {
        const areFriends = rules.areDirectFriends(doc,statement) || rules.areIndirectFriends(doc,statement,new Set());
        return areFriends;
    },
    areSiblings:(doc,statement)=> {
        const [X,Y] = statement;
        const parentsOfX = [...doc.findAllFacts(doc.records.parent,[Doc.wildCard,X])]//this is to collect all the facts that answers who the parent of x is
            .map(fact=>{ if (fact!==false) return fact[0]; });//this iterates through each fact to index into the first element to get the parent
        const parentsOfY = [...doc.findAllFacts(doc.records.parent,[Doc.wildCard,Y])]
            .map(fact=>{ if (fact!==false) return fact[0]; });
        const commonParent = Doc.intersection(new Set(parentsOfX),new Set(parentsOfY));
        return Boolean(commonParent.size);
    },
    areBrothers:(doc,statement) => {
        const [X,Y] = statement;
        if (X === Y) return false;
        const isXMale = doc.isItAFact(doc.records.male,[X]);
        const isYMale = doc.isItAFact(doc.records.male,[Y]);
        if (isXMale && isYMale && rules.areSiblings(doc,[X,Y])) return true;
        return false;
    }
};