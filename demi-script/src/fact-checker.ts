import {UniqueList} from "./unique-list.js";
import { permutations } from "combinatorial-generators";
import { LRUCache } from 'lru-cache';
import {v4 as uniqueID} from "uuid";
import { AddUnionToElements,Tuple } from "./type-helper.js";
import {stringify} from "safe-stable-stringify";

type Atom = string | number
export type Atoms = Atom[];
type PatternedAtoms = AddUnionToElements<Atoms,typeof Doc.wildCard>
type UniqueAtoms = UniqueList<Atom>
type Facts = (Atom[])[];//i typed it like this over Atoms[] is to prevent any for of ambiguity when reading it.Atoms[] may be read as an array of atoms by mistake instead of an array of atom arrays.

type Rule<T extends Atoms> = (doc:Doc,statement:T)=>boolean;
type RecursiveRule<T extends Atoms> = (doc:Doc,statement:T,visitedCombinations:Set<string>)=>boolean;

type Friends = string[];
type Male = [string];
type ParentToChild = [string,string];
type Eats = string[];

export interface Records {
    friends:Rec<Friends[]>//a predicate of two elements
    male:Rec<Male[]>,
    parent:Rec<ParentToChild[]>,
    eats:Rec<Eats[]>,
    allies?:Rec<Friends[]>//this is an alias to friends so its optional
}
export class Rec<T extends Facts = Facts> {
    public members:UniqueAtoms = new UniqueList();//i used a unique list to prevent duplicate entries which prevents the number of iterations when testing for a fact against an arbitrary member.its a list but uses a set to ensure that elements are unique which allows me to benefit from list iteration and uniqueness at the same time.I also localized this structure to per fact to only test against arbotrary members that are atually involved in a fact
    public container:UniqueAtoms[] = [];
    public recID:string = uniqueID();

    public constructor(facts:T) {
        for (const atoms of facts) {
            const uniqueAtoms:UniqueAtoms = new UniqueList(atoms);
            this.container.push(uniqueAtoms);
            for (const member of uniqueAtoms.list) {
                this.members.add(member);
            }
        }
    }
}
export class Doc {//I named it Doc instead of Document to avoid ambiguity with the default Document class which is for the DOM
    public records:Records;
    public static wildCard = Symbol('*');//i placed it behind a symbol to avoid collisions
    private factCheckerCache = new LRUCache<string,string>({max:100});

    public constructor(records:Records) {
        this.records = records;
    }
    //compare the subject array against the target.
    private compareStatements(subject:PatternedAtoms,target:PatternedAtoms):boolean {
        if (target.length === subject.length) {
            for (const [index,targetElement] of target.entries()) {
                const subjectElement = subject[index];
                if (subjectElement === targetElement) continue;
                else if (!this.isWildCard(subjectElement)) return false;//dont break it if the element in the subject array is an exception
            }
            return true;
        }
        return false;//a quick check to save computation.it infers that if the arrays arent of the same length,then they arent the same
    }
    public saveToFactsCache(key:string,facts:Facts):void {
        if (facts.length === 0) {
            this.factCheckerCache.set(key,stringify(false));
        }else {
            this.factCheckerCache.set(key,stringify(facts));
        }
    }
    //it returns the facts where the members match or false if the input isnt a fact.I made it to yield all the facts that match.Its useful for getting to answer questions like ada is the friend of who? by using null as a placeholder and getting all the facts that provide concrete values on what the placheolder is for those facts 
    public* findAllFacts(record:Rec,statement:PatternedAtoms,byMembership=false):Generator<Atoms | false,void,true | undefined>{//the byMembership mode is a different way of checking for fact truthiness by checking if all of the mebers in the statement are also members in a fact.if so,then its true.Its different from the deafult method which compares the statement to the fact by element order which mimics how prolog checks for facts.This way of checking for facts is useful when a fact can have an arbitrary number of atoms and checking if a statmet is a fact by checking the exact order of the elements is too strict that its fragile or even computationally infeasible.like if i were to check if two atoms,X and Y are friends where friends has an arbitarry number of atoms,then checking if they are friends will require me to fill in the gaps at the right positions with wildcards but it wont make sense if a fact has like 10 atoms.so checking if the statement is true by membership is the practical approach.Using the default checker is better for small-medium arity tuples.Another alternative is to reate a fact checking strategy that sorts the elements optionally before comparing and have a helper fill the remainder of the array  with wildcards.but set mebership is the most robust and fastest way of doing this same task.no overhead for sorting or padding needed
        //return early if the members from the input arent even available in the record,saving computation by preventing wasteful checks over all the facts in the record
        if (!this.areMembersInSet(statement,record.members.set)) {
            yield false;
            return;
        }
        //utilize the cache
        const cacheKey = `${record.recID}|${stringify(statement)}`;
        const cached = this.factCheckerCache.get(cacheKey);
        if (cached !== undefined) {//reuse cache if it exists.
            const cachedFacts:Facts | false = JSON.parse(cached); 
            if (cachedFacts===false) {
                yield false;
            }else for (const fact of cachedFacts) {
                yield fact;
            }
            return;
        }
        //the actual fact checking
        const matchedFacts:Facts = [];
        for (const uniqueAtoms of record.container) {
            if (this.areMembersInSet(statement,uniqueAtoms.set)) {
                if (byMembership || this.compareStatements(statement,uniqueAtoms.list)) {//compare statements method uses strict checking by checking if the statement is exactly identical to the fact by number of elements and element order.By placing this strict check under the membership check,the function saves computation by only scanning statements aginst relevant facts not a full linear scam against all facts
                    const atoms:Atoms = uniqueAtoms.list;
                    matchedFacts.push(atoms);
                    const saveToCacheEarly = yield atoms; 
                    if (saveToCacheEarly) this.saveToFactsCache(cacheKey,matchedFacts);
                }
            }
        }
        if (matchedFacts.length===0) yield false;
        this.saveToFactsCache(cacheKey,matchedFacts);
    }
    public getCombinationKey(...inputCombination:unknown[]):string {
        return inputCombination.map(element => stringify(element)).join('|');
    }
    //the checked facts is just a record to maintain recursion so the facts checked in a function call is not meant to persist across rules,else,subsequent calls to the same rule wont work as expected
    public* genCandidates<T extends Atoms,N extends number>(howManyToReturn:N,record:Rec<T[]>,inputCombination:unknown[],visitedCombinations:Set<string>)
    :Generator<Tuple<T[number],N>, void, unknown> {//if the caller is recursing on itself,then it should provide any input it receives relevant to the fact checking to prevent cycles.
        const sequences = permutations(record.members.list,howManyToReturn);//i chose permutations because the order at which the candidates are supplied matters but without replacement
        for (const permutation of sequences) {
            const combinationKey = this.getCombinationKey(...inputCombination, ...permutation);
            if (!visitedCombinations.has(combinationKey)) {
                visitedCombinations.add(combinationKey);
                yield permutation as Tuple<T[number],N>;
            }
        }
    }
    private isSymbol(arg:unknown):arg is symbol {
        return (typeof arg === "symbol");
    }
    private isWildCard(arg:unknown):boolean {
        if (arg === Doc.wildCard) {
            return true;
        }
        return false;
    }
    public findFirstFact(record: Rec, args:PatternedAtoms,byMembership=false):false | Atoms {
        const facts = this.findAllFacts(record, args,byMembership);
        const firstFact = facts.next().value as false | Atoms;
        facts.next(true);//save to cache without finishing the generator because since this function only collects the first fact,the generator may not have a chance to save results to the cache if there is ore than one matching fact.
        return firstFact;
    }
    //it returns true if all the elements in args are also present in the set and it returns false otherwise
    public areMembersInSet<T>(args:T[],set:Set<T>) {
        for (const arg of args) {
            if (!this.isSymbol(arg) && !this.isWildCard(arg) && !set.has(arg) ) {
                return false;//return early if the inputs arent even members to save computation.
            }
        }
        return true;
    }
    public selectSmallestRecord(...records: Rec[]): Rec {
        return records.reduce((smallest, current) =>
            current.members.set.size < smallest.members.set.size ? current : smallest
        );
    }
}



//A rule is a function that takes a document and a statement and tells if that statement is true from the given facts in the document whether it was explicitly stated or by inference from the rule itself.
export class Rules {//i had the rules as a seprate class to decouple it from the document.So all rules can be added here and be used on whatever document that needs itrather than decoupling specifc rules to the codument class
    public static isDirectFriend:Rule<[string,string]> = (doc,statement)=> {
        const [X,Y] = statement;
        return (//the reason why we are querying only for the first fact cuz we want to know if tey are direct friends or not without caring abut all the facts that makes this true
            Boolean(doc.findFirstFact(doc.records.friends,[X,Y],true)) 
        );
    };
    public static isIndirectFriend:RecursiveRule<[string,string]> = (doc,statement,visitedCombinations)=> {
        const [X,Y] = statement;
        const candidates = doc.genCandidates(1,doc.records.friends,statement,visitedCombinations);
        for (const [A] of candidates) {
            if (Rules.isDirectFriend(doc,[X,A])) {
                if (Rules.isDirectFriend(doc,[A,Y]) || Rules.isIndirectFriend(doc,[A,Y],visitedCombinations)) {
                    return true;
                }
            }
        }
        return false;
    };
    public static areFriends:Rule<[string,string]> = (doc,statement)=> {
        const areFriends = Rules.isDirectFriend(doc,statement) || Rules.isIndirectFriend(doc,statement,new Set());
        return areFriends;
    };
    public static sameParent:Rule<[string,string]> = (doc,statement)=> {
        const [X,Y] = statement;
        const parentRec = doc.records.parent;
        const parentFactX =  doc.findFirstFact(parentRec,[Doc.wildCard,X]);
        const parentFactY =  doc.findFirstFact(parentRec,[Doc.wildCard,Y]);
        if (parentFactX && parentFactY) {
            return parentFactX[0] === parentFactY[0];
        }
        return false;
    };
    public static areBrothers:Rule<[string,string]> = (doc,statement) => {
        const [X,Y] = statement;
        if (X === Y) return false;
        const maleRec = doc.records.male;
        const isMaleX = Boolean(doc.findFirstFact(maleRec,[X]));
        const isMaleY = Boolean(doc.findFirstFact(maleRec,[Y]));
        if (isMaleX && isMaleY && Rules.sameParent(doc,[X,Y])) return true;
        return false;
    };
}
