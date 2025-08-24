import { UniqueList } from "./unique-list.js";
import {v4 as uniqueID} from "uuid";

export type Tuple<T, N extends number, R extends unknown[] = []> = 
    R['length'] extends N ? R : Tuple<T, N, [...R, T]>;

export type TupleLength<T extends readonly any[]> = T['length'];

//this only works for non-negative integer unions up to 999.its capped because of recursion
export type Max<N extends number, A extends any[] = []> =
    [N] extends [Partial<A>['length']] ? A['length'] : Max<N, [0, ...A]>;

export type AddUnionToElements<T extends readonly any[], U> = {
    [K in keyof T]: T[K] | U;
};

export type WildCard = symbol;//i placed whatever string will be used as a wildcard behind a symbol to avoid collisions
export type Atom = string | number;
export type Atoms = Atom[];
export type PatternedAtoms = AddUnionToElements<Atoms,WildCard>;
export type UniqueAtoms = UniqueList<Atom>
export type Facts = (Atom[])[];//i typed it like this over Atoms[] is to prevent any for of ambiguity when reading it.Atoms[] may be read as an array of atoms by mistake instead of an array of atom arrays.

export class Rec<T extends Facts = Facts> {
    public members:UniqueAtoms = new UniqueList();//i used a unique list to prevent duplicate entries which prevents the number of iterations when testing for a fact against an arbitrary member.its a list but uses a set to ensure that elements are unique which allows me to benefit from list iteration and uniqueness at the same time.I also localized this structure to per fact to only test against arbotrary members that are atually involved in a fact
    public container:UniqueAtoms[] = [];
    public recID:string = uniqueID();

    public constructor(facts:T) {
        for (const atoms of facts) {
            this.build(atoms);
        }
    }
    public add(atoms:Atoms):void {
        this.build(atoms);
    }
    public build(atoms:Atoms):void {
        const uniqueAtoms:UniqueAtoms = new UniqueList(atoms);
        this.container.push(uniqueAtoms);
        for (const member of uniqueAtoms.list) {
            this.members.add(member);
        }
    }
}