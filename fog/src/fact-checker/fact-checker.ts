import { permutations } from "combinatorial-generators";
import { LRUCache } from 'lru-cache';
import { Tuple,validator,UniqueAtomList, UniqueList, Result,FullData } from "../utils/utils.js";
import {stringify} from "safe-stable-stringify";
import { AtomList,Atom } from "../utils/utils.js";
import { Rec } from "../utils/utils.js";
import fs from 'fs/promises';
import chalk from "chalk";
import { resolveDocument, Resolver } from "../resolver/resolver.js";
import {v4 as uniqueID} from "uuid";

export type Rule<T extends AtomList> = (doc:Doc,statement:T)=>boolean;
export type RecursiveRule<T extends AtomList> = (doc:Doc,statement:T,visitedCombinations:Set<string>)=>boolean;


const lime = chalk.hex('adef1e');
export class Doc {//I named it Doc instead of Document to avoid ambiguity with the default Document class which is for the DOM
    private _allMembers:UniqueAtomList = new UniqueList();//this is used by the binding to generate the types of the memebers.this will help catch subtle typos during querying.
    public records:Record<string,Rec> = {};

    public  predicates:Record<string,string> = {};

    public static wildCard = uniqueID();//by using a unique id over the string '*', will prevent collisions with atoms during fact checking.
    private static factCheckerCache = new LRUCache<string,string>({max:100});//so even if the client runs multiple times,they will still be using cached data.and to ensure this i made the cache static so that it doesnt get wiped on recreation of the doc class due to repeated imports from re-execution of client scripts

    public constructor(records:Record<string,Rec>,predicates:Record<string,string>) {
        //i merged all the aliases and predicates into a single record object for a stanadlone and complete transfer of all relation data--either predicates or aliases
        this.predicates = predicates;
        const predicatesToRec = new Map<string,Rec>();

        Object.keys(this.predicates).forEach(predicate=>{
            const referredPredicate = this.predicates[predicate];
            if (!predicatesToRec.has(referredPredicate)) {
                const rec = new Rec(records[referredPredicate].facts);//rebuild the rec from the facts since some internal structures arent serializable.  
                rec.members.list.map(member=>this._allMembers.add(member));
                predicatesToRec.set(referredPredicate,rec);
            }
        });

        Object.keys(records).forEach(key=>{
            const referredPredicate = this.predicates[key];
            this.records[key] = predicatesToRec.get(referredPredicate)!;
            // console.log("Records: ",this.records);//you can check the individual recIDs to verify if records from predicates have unique ids and those from aliases refer to the correct predicate record by checking if their recID is the same as the predicate rec they are referring to
        });
    }
    public get allMembers():AtomList {
        return this._allMembers.list;
    }
    //compare the subject array against the target.
    private compareStatements(subject:AtomList,target:AtomList):boolean {
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
    private saveToFactsCache(key:string,atomList:AtomList[]):void {
        console.log('saved to cache');
        if (atomList.length === 0) {
            Doc.factCheckerCache.set(key,stringify(false));
        }else {
            Doc.factCheckerCache.set(key,stringify(atomList));
        }
    }
    //it returns the facts where the members match or false if the input isnt a fact.I made it to yield all the facts that match.Its useful for getting to answer questions like ada is the friend of who? by using null as a placeholder and getting all the facts that provide concrete values on what the placheolder is for those facts 
    private* findAllFacts(record:Rec,statement:AtomList,byMembership:boolean):Generator<AtomList | false,void,boolean | undefined>{//the byMembership mode is a different way of checking for fact truthiness by checking if all of the mebers in the statement are also members in a fact.if so,then its true.Its different from the deafult method which compares the statement to the fact by element order which mimics how prolog checks for facts.This way of checking for facts is useful when a fact can have an arbitrary number of atoms and checking if a statmet is a fact by checking the exact order of the elements is too strict that its fragile or even computationally infeasible.like if i were to check if two atoms,X and Y are friends where friends has an arbitarry number of atoms,then checking if they are friends will require me to fill in the gaps at the right positions with wildcards but it wont make sense if a fact has like 10 atoms.so checking if the statement is true by membership is the practical approach.Using the default checker is better for small-medium arity tuples.Another alternative is to reate a fact checking strategy that sorts the elements optionally before comparing and have a helper fill the remainder of the array  with wildcards.but set mebership is the most robust and fastest way of doing this same task.no overhead for sorting or padding needed
        if (!record) return;
        //return early if the members from the input arent even available in the record,saving computation by preventing wasteful checks over all the facts in the record
        if (!this.areMembersInSet(statement,record.members.set)) {
            yield false;
            return;
        }
        //utilize the cache
        const cacheKey = `${record.recID}|${stringify(statement)}`;
        const cached = Doc.factCheckerCache.get(cacheKey);
        if (cached !== undefined) {//reuse cache if it exists.
            const cachedFacts:AtomList[] | false = JSON.parse(cached); 
            if (cachedFacts===false) {
                yield false;
            }else for (const fact of cachedFacts) {
                yield fact;
            }
            return;
        }
        //the actual fact checking
        const matchedFacts:AtomList[] = [];
        let saveToCacheEarly:boolean = false;
        for (const fact of record.facts) {
            if (this.areMembersInSet(statement,fact.set)) {
                if (byMembership || this.compareStatements(statement,fact.list)) {//compare statements method uses strict checking by checking if the statement is exactly identical to the fact by number of elements and element order.By placing this strict check under the membership check,the function saves computation by only scanning statements aginst relevant facts not a full linear scam against all facts
                    const atomList:AtomList = fact.list;
                    matchedFacts.push(atomList);
                    saveToCacheEarly = Boolean(yield atomList); 
                    if (saveToCacheEarly) this.saveToFactsCache(cacheKey,matchedFacts);
                }
            }
        }
        if (!saveToCacheEarly) this.saveToFactsCache(cacheKey,matchedFacts);
        if (matchedFacts.length===0) yield false;//the reason why this generator yields false is because it has to yield something to indicate that a fact is not is true.
    }
    //this function consumes the whole generator into an array and returns it
    public consumeAllFacts(record:Rec,statement:AtomList,byMembership:boolean):AtomList[] {
        const facts:AtomList[] = [];
        for (const fact of this.findAllFacts(record,statement,byMembership)) {
            if (fact!==false) facts.push(fact);
        }
        return facts;
    }
    //this function only consumes the generator till it reaches N.
    public findFirstNFacts(num:number,record: Rec,args:AtomList,byMembership:boolean):AtomList[] {
        const facts:AtomList[] = [];
        const factsGen = this.findAllFacts(record, args,byMembership);
        for (let i=0;i < num;i++) {
            const fact = factsGen.next().value as false | AtomList;
            if (fact===undefined) break;;//cut the loop short as soon as all the facts within 0 - n has been consumed without overshooting the generator just to reach n.
            if (fact!==false) facts.push(fact);
        }
        factsGen.next(true);//send a signal to the generator to save the results to the cache
        return facts;
    }
    public isItStated(record: Rec, args:AtomList,byMembership:boolean):boolean {
        return Boolean(this.findFirstNFacts(1,record,args,byMembership).length);
    }


    private getCombinationKey(...inputCombination:unknown[]):string {
        return inputCombination.map(element => stringify(element)).join('|');
    }
    //the checked facts is just a record to maintain recursion so the facts checked in a function call is not meant to persist across rules,else,subsequent calls to the same rule wont work as expected
    public* pullCandidates<T extends Atom,N extends number,list=UniqueList<T>['list'][number]>(howManyToReturn:N,record:Rec<UniqueAtomList[]>,inputCombination:Atom[],visitedCombinations:Set<string>)
    :Generator<Tuple<list,N>, void, unknown> {//if the caller is recursing on itself,then it should provide any input it receives relevant to the fact checking to prevent cycles.
        if (!record) return;
        const list = record.members.list;
        const sequences = permutations(list,Math.min(howManyToReturn,list.length));//i chose permutations because the order at which the candidates are supplied matters but without replacement
        for (const permutation of sequences) {
            const combinationKey = this.getCombinationKey(...inputCombination, ...permutation);
            if (!visitedCombinations.has(combinationKey)) {
                visitedCombinations.add(combinationKey);
                yield permutation as Tuple<list,N>;
            }
        }
    }
    private isWildCard(arg:unknown):boolean {
        return (arg === Doc.wildCard)?true:false;
    }
    //it returns true if all the elements in args are also present in the set and it returns false otherwise
    private areMembersInSet<T>(args:T[],set:Set<T>):boolean {
        if (!set) return false;
        for (const arg of args) {
            if (!this.isWildCard(arg) && !set.has(arg) ) {
                return false;//return early if the inputs arent even members to save computation.
            }
        }
        return true;
    }
    private static selectSmallestSet(...sets:Set<unknown>[]):Set<unknown> {
        return sets.reduce((smallest, current) =>
            current.size < smallest.size ? current : smallest
        );
    }
    public static selectSmallestRecord(...records: Rec[]): Rec {
        return records.reduce((smallest, current) =>
            current?.members.set.size < smallest?.members.set.size ? current : smallest
        );
    }
    public static intersection(...sets:Set<unknown>[]):Set<unknown> {
        const intersection = new Set<unknown>();
        const smallestSet = this.selectSmallestSet(...sets);
        for (const element of smallestSet) {
            if (sets.every(set=> set.has(element))) {
                intersection.add(element);
            }
        }
        return intersection;
    }
}
/**
 * It loads the document from the specifed path.If the path is directly to the json output,it directly imports it.Else,if its to the .fog file,it will transform it to the json output and then,import it.
 * 
 * This means that you can set the import path to the .fog src file to load it up and on subsequent queries,you can import the resolved json file to ensure that the document is only transformed when needed.
 * @param importPath 
 * @returns 
 */
export let docOnServer:Doc | null = null;

type Path = string;


async function loadDocFromJson(json:Path | Record<string,any>):Promise<Result> {
    const providedPath = typeof json === "string";
    const [jsonAsPath,jsonAsObject] = (providedPath)?[json,null]:[null,json];

    let fullData:FullData;
    
    if (providedPath) {
        const jsonString = await fs.readFile(jsonAsPath!, 'utf8');
        fullData = JSON.parse(jsonString);
    }else {
        fullData = jsonAsObject! as FullData;
    }

    const isValid = validator.Check(fullData);
    if (!isValid) {
        const errors = [...validator.Errors(fullData)].map(({ path, message }) => ({ path, message }));
        console.error(chalk.red('Validation error in the json file:'), errors);
        return Result.error;//to prevent corruption
    }
    
    if (providedPath) {
        console.info(lime('Successfully loaded the document from the path:'),jsonAsPath,'\n');
    }else {
        console.info(lime('Successfully loaded the document from the json object'));
    }
    docOnServer = new Doc(fullData.records,fullData.predicates);
    return Result.success;
}
export async function importDocFromObject(json:Record<string,any>):Promise<Result> {
    return await loadDocFromJson(json);
}
export async function importDocFromSrc(filePath:string,outputFolder:string) {
    const isSrcFile = filePath.endsWith(".fog");
}
//This function is intended to update the server side document with the json output.it doesnt accept no-output like the resolver.For the lsp that needs analysis data without making output,it should call the resolver directlt
export async function importDocFromPath(filePath:string,outputFolder:string):Promise<Result> {
    
    const isJsonFile = filePath.endsWith(".json");
    let jsonPath:string | null = isSrcFile?null:filePath;//i currently set it to null if its the src file because the json file isnt yet available at this time
    
    if (isSrcFile) {//this block creates the json output and loads it if its a src file.
        const {result,jsonPath:jsonPathResult} = await resolveDocument(filePath,outputFolder);
        if (result === Result.error) return Result.error;
        jsonPath = jsonPathResult!;//we can assert this here because if the resolver result isnt an error,then the path is guaranteed to be valid
    }
    else if (!isJsonFile) {
        console.error(chalk.red('The import path must be a .fog src file or the .json output'));
        return Result.error;
    }

    try {
        const result = await loadDocFromJson(jsonPath!);//the json path at this point will be valid because if it isnt,it would have returned early.
        return result;
    }catch { 
        const err = `${chalk.red.underline('\nUnable to find the resolved document.')}\n-Check for path typos or try importing the fog file directly to recreate the json file and ensure that the document doesnt contain errors that will prevent it from resolving to the json.\n`;
        if (!Resolver.terminate) console.error(err); //only log the io read error if it had nothing to do with the resolver.
        return Result.error;
    };
    
}