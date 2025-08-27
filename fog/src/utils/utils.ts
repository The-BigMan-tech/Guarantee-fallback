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

export enum Result {
    success='success',
    error='error'
}
export enum NoOutput {
    value='no-output'
}

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
export class UniqueList<T> {//A data structure that provides iteration and indexing like a list but with the uniqueness of a set
    public set: Set<T>; // Hash Set for uniqueness
    public list: T[];   // Dynamic Array to access last element
    private indexMap: Map<T, number>;//a map to keep track of indexes for efficient deleteion

    constructor(init?:T[]) {
        this.set = new Set();
        this.list = [];
        this.indexMap = new Map();
        if (init) {
            for (const element of init) {
                this.add(element);
            }
        }
    }
    // Add an element
    public add(element: T): boolean {//adds an element to this structure only if it doesnt exist at O(1) time
        if (!this.set.has(element)) {
            this.set.add(element);
            this.list.push(element);
            this.indexMap.set(element, this.list.length-1);
            return true; // Element was added
        }
        return false; // Element already exists
    }

    // Delete an element
    public delete(element: T): boolean {//deleted an element from the structure at O(1) time by using the swap and pop deletion method through the utilization of the map
        if (this.set.has(element)) {
            this.set.delete(element);
            const index = this.indexMap.get(element)!; // Get index in O(1)
            const lastElement = this.list[this.list.length - 1];
            this.list[index] = lastElement; // Move last element to the deleted spot
            this.indexMap.set(lastElement, index); // Update index map
            
            this.list.pop(); // Remove the last element
            this.indexMap.delete(element); // Remove from index map
            return true; // Element was deleted
        }
        return false; // Element does not exist
    }
}
