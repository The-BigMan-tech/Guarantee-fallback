/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {Box, checkBy, Doc, Implications } from "../main.js";
import { predicates as P } from "./documents/output/doc.types.js";
import * as zod from "zod";
import { CustomAsyncIterable } from "../observable-async-gen.js";
//I recommend generating the types for the document before writing the rules for better query safety by passing the predicates type as a generic to the Doc type
//you dont have to explicitly declare any of the rules as recursive or procedural rules since ts will flag any errors if you try to import a rules object with an incompatible signature using the useRules method on the document.This reduces the verbosity needed.

const statements = {//this is entirely for input validation.You just define the validation schema by name, for the statement input that each rule receives.and by exporting it into an implication object,the document will auto validate all incoming inputs on implication queries.This ensures clean separation of concerns by preveinting the rules form being bloated with input validation.And by making the document to only accept an implications object,input validation becomes an enforcement because the implication object is generically typed in a way that makes ts to enforce that every defined rule has a validation. 
    friends:()=>zod.tuple([zod.string(),zod.string()]),
    directFriends:()=>statements.friends(),
    indirectFriends:()=>statements.friends(),
    siblings:()=>zod.tuple([zod.string(),zod.string()]),
    brothers:()=>statements.siblings(),
};

export const rules = {//A rule is a function that takes a document and a statement and tells if that statement is true from the given facts in the document whether it was explicitly stated or by inference from the rule itself.
    directFriends:async (doc:Doc<P>,statement:[string,string])=> {
        return doc.isItStated(checkBy.Membership,'friends',statement);//its checking by membership not strict order to handle a statement of variable args and also when the order requirement isnt strict
    },
    indirectFriends:async (doc:Doc<P>,statement:[string,string],visitedCombinations:Box<string[]>)=> {
        const [X,Y] = statement;//its only handling two entities at a time to prevent unbound recursion.
        console.log('🚀 => :24 => visitedCombinations I:', visitedCombinations);
        const combinations = await doc.pullCandidates(1,'friends',statement,visitedCombinations) as CustomAsyncIterable<[string]>;
        for await (const [A] of combinations) {
            console.log('🚀 => :26 => A:', A);
            if (await rules.directFriends(doc,[X,A])) {
                if (await rules.directFriends(doc,[A,Y]) || await rules.indirectFriends(doc,[A,Y],visitedCombinations)) {
                    return true;
                }
            }
        }
        return false;
    },
    friends:async (doc:Doc<P>,statement:[string,string])=> {
        const areFriends = (await rules.directFriends(doc,statement)) || (await rules.indirectFriends(doc,statement,[ [] ]));
        return areFriends;
    },
    siblings:async (doc:Doc<P>,statement:[string,string])=> {
        const [X,Y] = statement;
        const parentsOfX = (await doc.findAllFacts(checkBy.ExactMatch,'parent',[await doc.wildCard(),X]))//do not check for truthiness by membership because a parent relationship is a strict order of parent to child not inseneitive to positions like as it is for friends
            .map(fact=>fact[0]);
        const parentsOfY = (await doc.findAllFacts(checkBy.ExactMatch,'parent',[await doc.wildCard(),Y]))
            .map(fact=>fact[0]);
        const commonParent = await doc.intersection([parentsOfX,parentsOfY]);
        return Boolean(commonParent.length);
    },
    brothers:async (doc:Doc<P>,statement:[string,string]) => {
        const [X,Y] = statement;
        if (X === Y) return false;
        const isXMale = await doc.isItStated(checkBy.Membership,'male',[X],);
        const isYMale = await doc.isItStated(checkBy.ExactMatch,'male',[Y]);
        if (isXMale && isYMale && await rules.siblings(doc,[X,Y])) return true;
        return false;
    }
};
export const implications:Implications<keyof typeof rules,P> = {
    statements:statements,
    rules:rules
};