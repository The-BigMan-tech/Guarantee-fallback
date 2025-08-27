import { RecursiveRule, Rule } from "fog-js";

interface Rules {
    areDirectFriends:Rule<[string,string]>,
    areIndirectFriends:RecursiveRule<[string,string]>,
    areFriends:Rule<[string,string]>,
    areSiblings:Rule<[string,string]>,
    areBrothers:Rule<[string,string]>
}
export const rules:Rules = {//A rule is a function that takes a document and a statement and tells if that statement is true from the given facts in the document whether it was explicitly stated or by inference from the rule itself.
    areDirectFriends:async (doc,statement)=> {
        const [X,Y] = statement;
        return (//the reason why its querying only for the first fact cuz we want to know if tey are direct friends or not without caring abut all the facts that makes this true
            doc.isItAFact('friends',[X,Y],true)
        );
    },
    areIndirectFriends:async (doc,statement,visitedCombinations)=> {
        const [X,Y] = statement;
        const {candidates,checkedCombinations} = await doc.genCandidates<string,1>(1,'friends',statement,visitedCombinations);
        for (const [A] of candidates) {
            if (await rules.areDirectFriends(doc,[X,A])) {
                if (await rules.areDirectFriends(doc,[A,Y]) || await rules.areIndirectFriends(doc,[A,Y],checkedCombinations)) {
                    return true;
                }
            }
        }
        return false;
    },
    areFriends:async (doc,statement)=> {
        const areFriends = (await rules.areDirectFriends(doc,statement)) || (await rules.areIndirectFriends(doc,statement,[]));
        return areFriends;
    },
    areSiblings:async (doc,statement)=> {
        const [X,Y] = statement;
        const parentsOfX = (await doc.findAllFacts('parent',[await doc.wildCard(),X]))
            .map(fact=>{ if (fact!==false) return fact[0]; });
        
        const parentsOfY = (await doc.findAllFacts('parent',[await doc.wildCard(),Y]))
            .map(fact=>{ if (fact!==false) return fact[0]; });

        const commonParent = await doc.intersection([parentsOfX,parentsOfY]);
        return Boolean(commonParent.length);
    },
    areBrothers:async (doc,statement) => {
        const [X,Y] = statement;
        if (X === Y) return false;
        const isXMale = await doc.isItAFact('male',[X]);
        const isYMale = await doc.isItAFact('male',[Y]);
        if (isXMale && isYMale && await rules.areSiblings(doc,[X,Y])) return true;
        return false;
    }
};