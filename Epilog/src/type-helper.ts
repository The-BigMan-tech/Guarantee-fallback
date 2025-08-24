import { UniqueList } from "./unique-list.js";
import {v4 as uniqueID} from "uuid";
import { Static, Type} from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';

export type Tuple<T, N extends number, R extends unknown[] = []> = 
    R['length'] extends N ? R : Tuple<T, N, [...R, T]>;

export type TupleLength<T extends readonly any[]> = T['length'];

//this only works for non-negative integer unions up to 999.its capped because of recursion
export type Max<N extends number, A extends any[] = []> =
    [N] extends [Partial<A>['length']] ? A['length'] : Max<N, [0, ...A]>;

export type AddUnionToElements<T extends readonly any[], U> = {
    [K in keyof T]: T[K] | U;
};

const atomSchema = Type.Union([Type.String(),Type.Number()]);
const uniqueAtomListSchema = Type.Object({
    list: Type.Array(atomSchema),
});

const factsSchema = Type.Array(uniqueAtomListSchema);
const recSchema = Type.Object({
    members:uniqueAtomListSchema,
    facts:factsSchema,
    recID: Type.String(),
});

const recordSchema = Type.Record(Type.String(), recSchema);
export const validator = TypeCompiler.Compile(recordSchema);
type RecType = Static<typeof recSchema>;


export type WildCard = symbol;//i placed whatever string will be used as a wildcard behind a symbol to avoid collisions
export type Atom = string | number;
export type AtomList = Atom[];
export type PatternedAtomList = AddUnionToElements<AtomList,WildCard>;
export type UniqueAtomList = UniqueList<Atom>
export type Facts = UniqueAtomList[];

export class Rec<T extends Facts = Facts> implements RecType {
    public members:UniqueAtomList = new UniqueList();//i used a unique list to prevent duplicate entries which prevents the number of iterations when testing for a fact against an arbitrary member.its a list but uses a set to ensure that elements are unique which allows me to benefit from list iteration and uniqueness at the same time.I also localized this structure to per fact to only test against arbotrary members that are atually involved in a fact
    public facts:Facts = [];
    public recID:string = uniqueID();

    public constructor(facts:T) {
        for (const uniqueAtomList of facts) {
            this.build(uniqueAtomList,true);
        }
    }
    public add(atomList:AtomList):void {
        const uniqueAtomList = new UniqueList(atomList);
        this.build(uniqueAtomList,false);
    }
    public build(uniqueAtomList:UniqueAtomList,recreateList:boolean):void {
        if (recreateList) uniqueAtomList = new UniqueList(uniqueAtomList.list);//recereate the unique list since the set and index map isnt included in the serialized json file
        this.facts.push(uniqueAtomList);
        for (const member of uniqueAtomList.list) {
            this.members.add(member);
        }
    }
}
