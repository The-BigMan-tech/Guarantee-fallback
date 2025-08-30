/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {checkBy, Doc, GeneratedCandidates } from "../main.js";
import { predicates as P } from "./documents/output/doc.types.js";

//you dont have to explicitly declare any of the rules as recursive or procedural rules since ts will flag any errors if you try to import a rules object with an incompatible signature using the useRules method on the document.This reduces the verbosity needed.
export const rules = {//A rule is a function that takes a document and a statement and tells if that statement is true from the given facts in the document whether it was explicitly stated or by inference from the rule itself.
    directFriends:async (doc:Doc<P>,statement:string[])=> {
        return doc.isItStated('friends',statement,checkBy.Membership);//its checking by membership not strict order to handle a statement of variable args and also when the order requirement isnt strict
    },
    indirectFriends:async (doc:Doc<P>,statement:[string,string],visitedCombinations:string[])=> {
        const [X,Y] = statement;//its only handling two entities at a time to prevent unbound recursion.
        const {combinations,checkedCombinations} = await doc.genCandidates(1,'friends',statement,visitedCombinations) as GeneratedCandidates<string,1>;
        for (const [A] of combinations) {
            if (await rules.directFriends(doc,[X,A])) {
                if (await rules.directFriends(doc,[A,Y]) || await rules.indirectFriends(doc,[A,Y],checkedCombinations)) {
                    return true;
                }
            }
        }
        return false;
    },
    friends:async (doc:Doc<P>,statement:[string,string])=> {
        const areFriends = (await rules.directFriends(doc,statement)) || (await rules.indirectFriends(doc,statement,[]));
        return areFriends;
    },
    siblings:async (doc:Doc<P>,statement:[string,string])=> {
        const [X,Y] = statement;
        const parentsOfX = (await doc.findAllFacts('parent',[await doc.wildCard(),X],checkBy.ExactMatch))//do not check for truthiness by membership because a parent relationship is a strict order of parent to child not inseneitive to positions like as it is for friends
            .map(fact=>fact[0]);
        const parentsOfY = (await doc.findAllFacts('parent',[await doc.wildCard(),Y],checkBy.ExactMatch))
            .map(fact=>fact[0]);
        const commonParent = await doc.intersection([parentsOfX,parentsOfY]);
        return Boolean(commonParent.length);
    },
    brothers:async (doc:Doc<P>,statement:[string,string]) => {
        const [X,Y] = statement;
        if (X === Y) return false;
        const isXMale = await doc.isItStated('male',[X],checkBy.Membership);
        const isYMale = await doc.isItStated('male',[Y],checkBy.ExactMatch);
        if (isXMale && isYMale && await rules.siblings(doc,[X,Y])) return true;
        return false;
    }
};
