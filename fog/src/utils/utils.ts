import {v4 as uniqueID} from "uuid";
import { Static, Type} from '@sinclair/typebox';
import chalk, { ChalkInstance } from "chalk";
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
export interface ResolutionResult {
    result:Result,
    jsonPath:string | undefined,
}
const atomSchema = Type.Union([Type.String(),Type.Number()]);
const uniqueAtomListSchema = Type.Object({
    list: Type.Array(atomSchema),
});

const factsSchema = Type.Array(uniqueAtomListSchema);
const recSchema = Type.Object({
    facts:factsSchema,
});

const predicateSchema = Type.Record(Type.String(),Type.String());
const recordSchema = Type.Record(Type.String(), recSchema);

const fullSchema = Type.Object({
    predicates:predicateSchema,
    records:recordSchema
});

export const validator = TypeCompiler.Compile(fullSchema);

export interface FullData {
    predicates:Record<string,string>,
    records:Record<string,Rec>
}
type RecType = Static<typeof recSchema>;

export type Atom = string | number;
export type AtomList = Atom[];
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
export function isGenerator(value: any): value is Generator {
    return (
        value !== null && 
        value !== undefined &&
        typeof value === 'object' && 
        typeof value.next === 'function' && 
        typeof value.throw === 'function'
    );
}
export function stripLineBreaks(str:string,replaceWith?:string):string {
    return str.replace(/\r?\n|\r/g,replaceWith || "");
}
export function convMapToRecord<K extends string | number | symbol,V>(map:Map<K,V>):Record<K,V> {
    const rec:Record<K,V> = {} as Record<K,V>;
    const keys = [...map.keys()];
    keys.forEach(key=>(rec[key]=map.get(key)!));
    return rec;
}
export function isWhitespace(str: string): boolean {
    const strippedStr = stripLineBreaks(str).trim();
    return strippedStr.length === 0;
}
export function getOrdinalSuffix(n:number):string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
export function replaceLastOccurrence(str:string, search:string, replacement:string):string {
    const lastIndex = str.lastIndexOf(search);
    if (lastIndex === -1) return str; // string not found, return original
    return str.slice(0, lastIndex) + replacement + str.slice(lastIndex + search.length);
}
export function createKey(line:number,content:string):string {
    const key = stripLineBreaks(`${line}|${content}`);
    return key;
}
export function contentFromKey(key:string):string {//this function assumes that the key was created from the createKey function
    return key.slice(key.indexOf('|') + 1);
}
export function lineFromKey(key: string):number {
    const pipeIndex = key.indexOf('|');
    const linePart = key.slice(0, pipeIndex);
    const lineNumber = Number(linePart);
    if (Number.isNaN(lineNumber))throw new Error('Invalid key format: line number is not a number');
    return lineNumber;
}
export function xand(a:boolean,b:boolean):boolean {
    return (!a && !b) || (a && b);
}
export enum EndOfLine {
    value=-1//i used a number for better type safety by allowing ts to differentiate it from the other src text that are strings
}
export const brown = chalk.hex("#ddcba0ff");
export const lime = chalk.hex('adef1e');
export const orange = chalk.hex('f09258f');
export const darkGreen = chalk.hex('98ce25ff');

export function mapToColor(kind:ReportKind):ChalkInstance | null {
    switch (kind) {
    case(ReportKind.Semantic): {
        return chalk.red;
    }
    case (ReportKind.Syntax): {
        return chalk.red;
    }
    case (ReportKind.Warning): {
        return orange;
    }
    }
    return null;
}
export const omittedJsonKeys = new Set(['set','indexMap','recID','members']);//I didnt preserve recID because they are just for caching and not lookups.New ones can be reliably generated at runtime for caching.

export function omitJsonKeys(key:string,value:any):any | undefined {
    if (omittedJsonKeys.has(key)) {
        return undefined; // exclude 'password'
    }
    return value; // include everything else
}

export enum ReportKind {
    Semantic="Semantic Error at",
    Syntax="Syntax Error at",
    Warning="Double check",
    Hint="Hint at"
}
export type InlineSrcText = string | string[] | EndOfLine;

export type Path = string;

export interface Report {
    kind:ReportKind,
    line:number,//this is 0-based
    lines?:number[]
    msg:string,
    srcText:InlineSrcText
    usingSrcLines?:string[]
}
//These are for use by the lsp
export enum lspSeverity {
    Error=1,
    Warning = 2,
    Information = 3,
    Hint = 4
}
export interface lspPosition {
    line:number,
    character:number
}
export interface lspRange {
    start:lspPosition,
    end:lspPosition,
}
export interface lspDiagnostics {
    range:lspRange
    severity?:lspSeverity,
    message:string,
}
export interface lspCompletionItem {
    label:string; 
    kind:lspCompletionItemKind
    insertText?:string
    insertTextFormat?:lspInsertTextFormat
}
export enum lspCompletionItemKind {
    Text=1,//for comments or general text
    Keyword=14,//for the alias and the different refs keywords 
    Constant=21,//for name and alias suggestion
}
export enum lspInsertTextFormat {
  PlainText = 1, // The insertText is treated as plain text.
  Snippet = 2    // The insertText is treated as a snippet, supporting placeholders/tab stops.
}


