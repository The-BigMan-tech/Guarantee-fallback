import { Rule ,RecursiveRule,Check} from "../main.js";

interface Rules {
    directFriends:Rule<string[]>,
    indirectFriends:RecursiveRule<[string,string]>,
    friends:Rule<[string,string]>,
    siblings:Rule<[string,string]>,
    brothers:Rule<[string,string]>
}
export const rules:Rules = {//A rule is a function that takes a document and a statement and tells if that statement is true from the given facts in the document whether it was explicitly stated or by inference from the rule itself.
    directFriends:async (doc,statement)=> {
        return doc.isItAFact('friends',statement,Check.byMembership);//its checking by membership not strict order to handle a statement of variable args and also when the order requirement isnt strict
    },
    indirectFriends:async (doc,statement,visitedCombinations)=> {
        const [X,Y] = statement;//its only handling two entities at a time to prevent unbound recursion.
        const {candidates,checkedCombinations} = await doc.genCandidates<string,1>(1,'friends',statement,visitedCombinations);
        for (const [A] of candidates) {
            if (await rules.directFriends(doc,[X,A])) {
                if (await rules.directFriends(doc,[A,Y]) || await rules.indirectFriends(doc,[A,Y],checkedCombinations)) {
                    return true;
                }
            }
        }
        return false;
    },
    friends:async (doc,statement)=> {
        const areFriends = (await rules.directFriends(doc,statement)) || (await rules.indirectFriends(doc,statement,[]));
        return areFriends;
    },
    siblings:async (doc,statement)=> {
        const [X,Y] = statement;
        const parentsOfX = (await doc.findAllFacts('parent',[await doc.wildCard(),X],Check.byExactMatch))//do not check for truthiness by membership because a parent relationship is a strict order of parent to child not inseneitive to positions like as it is for friends
            .map(fact=>fact[0]);
        const parentsOfY = (await doc.findAllFacts('parent',[await doc.wildCard(),Y],Check.byExactMatch))
            .map(fact=>fact[0]);
        const commonParent = await doc.intersection([parentsOfX,parentsOfY]);
        return Boolean(commonParent.length);
    },
    brothers:async (doc,statement) => {
        const [X,Y] = statement;
        if (X === Y) return false;
        const isXMale = await doc.isItAFact('male',[X],Check.byMembership);
        const isYMale = await doc.isItAFact('male',[Y],Check.byMembership);
        if (isXMale && isYMale && await rules.siblings(doc,[X,Y])) return true;
        return false;
    }
};