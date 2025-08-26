import { permutations } from "combinatorial-generators";
import { LRUCache } from 'lru-cache';
import { Tuple, UniqueAtomList, validator } from "../utils/utils.js";
import {stringify} from "safe-stable-stringify";
import { AtomList } from "../utils/utils.js";
import { PatternedAtomList } from "../utils/utils.js";
import { Rec } from "../utils/utils.js";
import fs from 'fs/promises';
import chalk from "chalk";
import path from "path";
import { spawn } from 'child_process';

export type Rule<T extends AtomList> = (doc:Doc,statement:T)=>boolean;
export type RecursiveRule<T extends AtomList> = (doc:Doc,statement:T,visitedCombinations:Set<string>)=>boolean;


const lime = chalk.hex('adef1e');
export class Doc {//I named it Doc instead of Document to avoid ambiguity with the default Document class which is for the DOM
    public records:Record<string,Rec> = {};
    public static wildCard = Symbol('*');
    private factCheckerCache = new LRUCache<string,string>({max:100});

    public constructor(records:Record<string,Rec>) {
        Object.keys(records).forEach(key=>{
            this.records[key] = new Rec(records[key].facts);
        });
    }
    //compare the subject array against the target.
    private compareStatements(subject:PatternedAtomList,target:PatternedAtomList):boolean {
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
    public saveToFactsCache(key:string,atomList:AtomList[]):void {
        if (atomList.length === 0) {
            this.factCheckerCache.set(key,stringify(false));
        }else {
            this.factCheckerCache.set(key,stringify(atomList));
        }
    }
    //it returns the facts where the members match or false if the input isnt a fact.I made it to yield all the facts that match.Its useful for getting to answer questions like ada is the friend of who? by using null as a placeholder and getting all the facts that provide concrete values on what the placheolder is for those facts 
    public* findAllFacts(record:Rec,statement:PatternedAtomList,byMembership=false):Generator<AtomList | false,void,true | undefined>{//the byMembership mode is a different way of checking for fact truthiness by checking if all of the mebers in the statement are also members in a fact.if so,then its true.Its different from the deafult method which compares the statement to the fact by element order which mimics how prolog checks for facts.This way of checking for facts is useful when a fact can have an arbitrary number of atoms and checking if a statmet is a fact by checking the exact order of the elements is too strict that its fragile or even computationally infeasible.like if i were to check if two atoms,X and Y are friends where friends has an arbitarry number of atoms,then checking if they are friends will require me to fill in the gaps at the right positions with wildcards but it wont make sense if a fact has like 10 atoms.so checking if the statement is true by membership is the practical approach.Using the default checker is better for small-medium arity tuples.Another alternative is to reate a fact checking strategy that sorts the elements optionally before comparing and have a helper fill the remainder of the array  with wildcards.but set mebership is the most robust and fastest way of doing this same task.no overhead for sorting or padding needed
        if (!record) return;
        //return early if the members from the input arent even available in the record,saving computation by preventing wasteful checks over all the facts in the record
        if (!this.areMembersInSet(statement,record.members.set)) {
            yield false;
            return;
        }
        //utilize the cache
        const cacheKey = `${record.recID}|${stringify(statement)}`;
        const cached = this.factCheckerCache.get(cacheKey);
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
        for (const fact of record.facts) {
            if (this.areMembersInSet(statement,fact.set)) {
                if (byMembership || this.compareStatements(statement,fact.list)) {//compare statements method uses strict checking by checking if the statement is exactly identical to the fact by number of elements and element order.By placing this strict check under the membership check,the function saves computation by only scanning statements aginst relevant facts not a full linear scam against all facts
                    const atomList:AtomList = fact.list;
                    matchedFacts.push(atomList);
                    const saveToCacheEarly = yield atomList; 
                    if (saveToCacheEarly) this.saveToFactsCache(cacheKey,matchedFacts);
                }
            }
        }
        this.saveToFactsCache(cacheKey,matchedFacts);
        if (matchedFacts.length===0) yield false;
    }
    public findFirstFact(record: Rec, args:PatternedAtomList,byMembership=false):false | AtomList {
        const facts = this.findAllFacts(record, args,byMembership);
        const firstFact = facts.next().value as false | AtomList;
        facts.next(true);//save to cache without finishing the generator because since this function only collects the first fact,the generator may not have a chance to save results to the cache if there is ore than one matching fact.
        return firstFact;
    }
    public isItAFact(record: Rec, args:PatternedAtomList,byMembership=false):boolean {
        return Boolean(this.findFirstFact(record,args,byMembership));
    }


    public getCombinationKey(...inputCombination:unknown[]):string {
        return inputCombination.map(element => stringify(element)).join('|');
    }
    //the checked facts is just a record to maintain recursion so the facts checked in a function call is not meant to persist across rules,else,subsequent calls to the same rule wont work as expected
    public* genCandidates<T extends UniqueAtomList,N extends number>(howManyToReturn:N,record:Rec<T[]>,inputCombination:unknown[],visitedCombinations:Set<string>)
    :Generator<Tuple<T['list'][number],N>, void, unknown> {//if the caller is recursing on itself,then it should provide any input it receives relevant to the fact checking to prevent cycles.
        if (!record) return;
        const sequences = permutations(record.members.list,howManyToReturn);//i chose permutations because the order at which the candidates are supplied matters but without replacement
        for (const permutation of sequences) {
            const combinationKey = this.getCombinationKey(...inputCombination, ...permutation);
            if (!visitedCombinations.has(combinationKey)) {
                visitedCombinations.add(combinationKey);
                yield permutation as Tuple<T['list'][number],N>;
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
    //it returns true if all the elements in args are also present in the set and it returns false otherwise
    private areMembersInSet<T>(args:T[],set:Set<T>):boolean {
        if (!set) return false;
        for (const arg of args) {
            if (!this.isSymbol(arg) && !this.isWildCard(arg) && !set.has(arg) ) {
                return false;//return early if the inputs arent even members to save computation.
            }
        }
        return true;
    }
    public static selectSmallestSet<T>(...sets:Set<T>[]):Set<T> {
        return sets.reduce((smallest, current) =>
            current.size < smallest.size ? current : smallest
        );
    }
    public static selectSmallestRecord(...records: Rec[]): Rec {
        return records.reduce((smallest, current) =>
            current?.members.set.size < smallest?.members.set.size ? current : smallest
        );
    }
    public static intersection<T>(...sets:Set<T>[]):Set<T> {
        const intersection = new Set<T>();
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
 * It loads the document from the specifed path.If the path is directly to the json output,it directly imports it.Else,if its to the .el file,it will transform it to the json output and then,import it.In the second case,an output path must be specified.
 * 
 * This means that you can set the import path to the .el src file to load it up and on subsequent queries,you can import the resolved json file to ensure that the document is only transformed when needed.
 * @param importPath 
 * @returns 
 */
export async function importDoc(filePath:string,outputFolder?:string):Promise<Doc | undefined> {
    if (!(filePath.endsWith(".el") || filePath.endsWith(".json"))) {
        console.error(chalk.red('The import path must be a .el src file or the .json output'));
        return;
    }
    const isJson = filePath.endsWith(".json");
    let jsonPath:string = isJson?filePath:'';
    if (!isJson) {
        if (!outputFolder) {
            console.error(chalk.red('An output path must be specified if the import is the src file'));
            return;
        }
        const cliArgs = ['--src',filePath, '--out', outputFolder];
        const child = spawn('epilog-resolver', cliArgs, { stdio: 'inherit',shell:true });
        const exitCode = await new Promise<number>((resolve, reject) => {
            child.on('close', resolve);
            child.on('error', reject);
        });
        if (exitCode !== 0) {
            console.error(`Resolver CLI exited with code ${exitCode}`);
            return;
        }
        const jsonFilePath = path.basename(filePath, path.extname(filePath)) + '.json';
        jsonPath = path.join(outputFolder,jsonFilePath);
    }
    try {
        const jsonData = await fs.readFile(jsonPath, 'utf8');
        const records:Record<string,Rec> = JSON.parse(jsonData);
        const isValid = validator.Check(records);
        if (!isValid) {
            const errors = [...validator.Errors(jsonData)].map(({ path, message }) => ({ path, message }));
            console.error(chalk.red('Validation error in the json file:'), errors);
            return;//to prevent corruption
        }
        const doc = new Doc(records);
        console.info(lime('Successfully loaded the document from the path:'),jsonPath,'\n');
        return doc;
    }catch { console.error(`${chalk.red.underline('\nUnable to find the resolved document.')}\n-Check for path typos or try importing the .el file directly to recreate the json file and ensure that the document doesnt contain errors that will prevent it from resolving to the json.\n`); };
}


