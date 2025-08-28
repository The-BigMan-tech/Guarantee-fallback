/* eslint-disable indent */
import { Atom, Doc, RecursiveRule, Rule } from "./main.js";

export interface InferrableDoc extends Doc {
    isItImplied:(rule:string,statement:Atom[])=>Promise<boolean> | ((...args:any[])=>any),
}
interface Rules {
    directFriends:Rule<string[]>,
    indirectFriends:RecursiveRule<[string,string]>,
    friends:Rule<[string,string]>,
    siblings:Rule<[string,string]>,
    brothers:Rule<[string,string]>
}
const rules:Rules = {//A rule is a function that takes a document and a statement and tells if that statement is true from the given facts in the document whether it was explicitly stated or by inference from the rule itself.
    directFriends:async (doc,statement)=> {
        return doc.isItAFact('friends',statement,true);//its checking by membership not strict order to handle a statement of variable args and also when the order requirement isnt strict
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
        const parentsOfX = (await doc.findAllFacts('parent',[await doc.wildCard(),X]))
            .map(fact=>fact[0]);
        const parentsOfY = (await doc.findAllFacts('parent',[await doc.wildCard(),Y]))
            .map(fact=>fact[0]);
        const commonParent = await doc.intersection([parentsOfX,parentsOfY]);
        return Boolean(commonParent.length);
    },
    brothers:async (doc,statement) => {
        const [X,Y] = statement;
        if (X === Y) return false;
        const isXMale = await doc.isItAFact('male',[X]);
        const isYMale = await doc.isItAFact('male',[Y]);
        if (isXMale && isYMale && await rules.siblings(doc,[X,Y])) return true;
        return false;
    }
};
export function getInferrableDoc(doc:Doc):InferrableDoc {
    const inferredDoc:InferrableDoc = {
        ...doc,
        isItImplied:async (rule,statement)=>{//this is a pattern to query rules with the same interface design as querying a fact
            const aliases = await doc.aliases();
            switch (aliases[rule] || rule) {//i did a look up on the aliases rather than strictly the rule name itself so that it can also work for aliases
                case (aliases['friends']):return await rules.friends(doc,statement as [string,string]);//so this will trigger if both the string and the input refer to the same predicate
                case ('siblings'):return await rules.siblings(doc,statement as [string,string]);//this one is for exact matching because this string is not used in the document.Its a new keyword so there is no existing aliases for it.This knowledge has to come from  the author
                case ('brothers'):return await rules.brothers(doc,statement as [string,string]);
            }
            return false;
        }
    };
    return inferredDoc;
}