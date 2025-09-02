import ipc from 'node-ipc';
import chalk from "chalk";
import path from "path";
import fs from "fs/promises";
import { JSONRPCClient, JSONRPCResponse } from "json-rpc-2.0";
import { ZodError } from 'zod';
import * as zod from "zod";
import { BehaviorSubject,Observable, Subscriber, Subscription } from 'rxjs';
import { observableToAsyncGen,consumeAsyncIterable } from './observable-async-gen.js';

const streamResult = new BehaviorSubject<Response<any> | null>(null); // Initial value can be null or any default
export const streamObservable = streamResult.asObservable();

const client = new JSONRPCClient(async (jsonRPCRequest) =>{
    const ipcServerID = 'fog-ipc-server';
    ipc.config.silent = true;
    ipc.connectTo(ipcServerID, () => {
        const server = ipc.of[ipcServerID]; 
        server.on('connect', () => {//make the request.the request should not be stringified
            server.emit('message',jsonRPCRequest);
        });
        server.on('message', (data: string) => {//get the response
            try {
                const jsonRPCResponse = JSON.parse(data) as JSONRPCResponse;
                const result = jsonRPCResponse.result as Response<any>;
                client.receive({...jsonRPCResponse,result:result.value});//hanlde the response
                streamResult.next(result);
                if (result.finished) ipc.disconnect(ipcServerID);//close the connection when all the data for the request has been fully sent
            }catch (err) {
                console.error(chalk.red('Error processing message:'));
                throw new Error(String(err));
            } 
        });
        server.on('error',():never => {
            throw new Error(chalk.red('The server encountered an error or it may not have been started.'));
        });
    });
});
//this function runs the following callback with the response and automatically runs cleanup logic when the stream is fully processed
function processStream<T>(subscriber:Subscriber<any>,subscription:Subscription | null,response:Response<any> | null,func:(subscriber:Subscriber<any>,value:T)=>void):void {
    if (!(response!.finished)) {
        func(subscriber,response!.value as T);
    }else {
        subscriber.complete();
        subscription?.unsubscribe();
    }
}
async function readStream<R,T>(func:(subscriber:Subscriber<R>,value:T)=>void):Promise<R[]> {
    const subscriberFunc = (subscriber:Subscriber<R>):void =>{//observe the stream and inform the subscriber
        let subscription: Subscription | null = null;
        subscription = streamObservable.subscribe(response => {
            processStream<T>(subscriber,subscription,response,func);
        });
    };
    const observable = new Observable<R>(subscriber=>subscriberFunc(subscriber));//create the observable
    return await consumeAsyncIterable(observableToAsyncGen(observable));//this ensures that the stream is fully consumed before returning to the client to prevent concurrency issues where the client may initiate another request which will cancel the stream
}
function resolutionErr(result:Result):boolean {
    if (result === Result.error) {
        console.log(chalk.red("An error occurred while resolving the document.See the server."));
        console.log(chalk.yellow("You may also want to check the .ansi log at the output folder with an ansi file previewer if generated."));
        return true;
    }
    return false;
}
/**It loads the server document with the data from the file using the file path provided.
 * It can take a .fog document or a .json file.
 * For the .json file,it directly loads the data onto the server document but for the .fog file,it resolves the document to the provided output folder and loads the data onto the server
 */

export async function importDocFromPath<I extends Info,P extends string=I['predicates'],R extends string=I['keyofRules'],M extends Atom=I['members']>(filePath:string,outputFolder?:string):Promise<Doc<P,R,M> | undefined> {
    const result = await client.request("importDocFromPath",{filePath,outputFolder}) as Result;
    if (resolutionErr(result)) return;
    console.log(chalk.green('\nSuccessfully loaded the document onto the server.'));
    return new Doc<P,R,M>();
}
export async function importDocFromObject<I extends Info,P extends string=I['predicates'],R extends string=I['keyofRules'],M extends Atom=I['members']>(obj:Record<string,any>):Promise<Doc<P,R,M> | undefined> {
    const result = await client.request("importDocFromObject",{obj}) as Result;
    if (resolutionErr(result)) return;
    console.log(chalk.green('\nSuccessfully loaded the document onto the server.'));
    return new Doc<P,R,M>();
}
//this binding is intended for the lsp to use to get analysis report without affecting the ipc server
export async function resolveDoc(filePath:string,outputFolder?:string | NoOutput):Promise<ResolutionResult | undefined> {
    const resolutionResult = await client.request("resolveDocToJson",{filePath,outputFolder:outputFolder}) as ResolutionResult;
    if (resolutionErr(resolutionResult.result)) return;
    console.log(chalk.green('\nSuccessfully resolved the document.'));
    return resolutionResult;
}
export async function genTypes<P extends string,R extends string>(docName:string,outputFolder:string,doc:Doc<string,string>,rules?:Record<R,Rule<P>>):Promise<void> {
    const exportType = (declaration:string):string =>`export ${declaration}`;
    const declareType = (name:string):string =>`type ${name} =`;
    const kvPair = (key:string,value:string):string =>`${key}:${value}`;

    const declareInterface = (name:string,pairs:string[],indentation:number):string =>{
        const indentedPairs = pairs.map(pair=>pair.padStart(pair.length + indentation,' '));
        return `interface ${name} {\n${indentedPairs.join(',\n')}\n}`;
    };

    const union = ' | ';
    const terminator = ";\n";

    const typeFile = docName + '.types.ts';
    const typeFilePath = path.join(outputFolder,typeFile);
    
    const [predicatesType,membersType,keyofRulesType] = ['predicates','members','keyofRules'];

    const memberUnion =  (await doc.allMembers()).map(member=>{
        return (typeof member==="string")?`"${member}"`:member;
    }).join(union);
    
    const memberDeclaration = exportType(`${declareType(membersType)} ${memberUnion}`);
    await fs.writeFile(typeFilePath,memberDeclaration + terminator);

    const predicates = new Set<string>();
    Object.entries(await doc.predicates()).forEach(([alias,predicate])=>{
        predicates.add(alias);
        predicates.add(predicate);
    });

    const predicatesUnion = Array.from(predicates).map(predicate=>`"${predicate}"`).join(union);
    const predicatesDeclaration = exportType(`${declareType(predicatesType)} ${predicatesUnion}`);
    await fs.appendFile(typeFilePath,predicatesDeclaration + terminator);

    if (rules) {
        const rulesUnion = (rules)?Object.keys(rules).map(rKey=>`"${rKey}"`).join(union):'';
        const rulesDeclaration = exportType(`${declareType(keyofRulesType)} ${rulesUnion}`);
        await fs.appendFile(typeFilePath,rulesDeclaration + terminator);
    }
    const kvPairs = [
        kvPair(predicatesType,predicatesType),
        kvPair(membersType,membersType)
    ];
    if (rules) {
        kvPairs.push(kvPair(keyofRulesType,keyofRulesType));
    }else {
        kvPairs.push(kvPair(keyofRulesType,`''`));
    }
    const infoInterface = exportType(declareInterface('info',kvPairs,4));
    await fs.appendFile(typeFilePath,infoInterface + terminator);

    console.log(chalk.green('Sucessfully generated the types at: '),typeFilePath);
}
//this takes in a .fog src file,an output folder and the rules.It then loads the document on the server as well as generating the types
export async function setupOutput<P extends string,R extends string>(srcFilePath:string,outputFolder:string,rules?:Record<R,Rule<P>>):Promise<void> {
    const doc = await importDocFromPath(srcFilePath,outputFolder);
    const docName = path.basename(srcFilePath,path.extname(srcFilePath));
    if (doc) await genTypes(docName,outputFolder,doc,rules);
}
export class Doc<//i used an empty string over the string type for better type safety by preventing the generics from mathcing every string by default
    P extends string ='',//"Prediactes" or aliases
    R extends string ='',//the union of all the keys in a "Rule"
    M extends Atom = Atom,//these are the "Members" of the document.Its a union type
    L extends Atom[] = AtomList<M>//the "List" of all the members
    > {
    //i used arrow methods so that i can have these methods as properties on the object rather than methods.this will allow for patterns like spreading    
    //this method allows the user to query for the truthiness of a statement of a rule the same way they do with facts.So that rather than calling methods directly on the rule object,they write the name of the rule they want to check against as they would for fact querying and this method will forward it to the correct rule by key.It also includes aliases allowing users to also query rules with aliases that will still forward to the correct rule even though the rule's name isnt the alias.
    //this is recommended to use for querying rather direct function calls on a rule object but use the rule object to directly build functions or other rules for better type safety and control and use this mainly as a convenience for querying.
    //it will also fallback to direct fact checking if the statement doesnt satisfy any of the given rules making it a good useful utility for querying the document against all known facts and rules with alias support in a single call.Rules will be given priority first over direct fact checking because this method unlike isItAFact is designed for checking with inference.The check mode is used as part of the fallback to fact querying
    public isItImplied:(fallback:FactCheckMode,relation:P | R,statement:L,visitedCombinations?:Box<string[]>)=>Promise<boolean | Result.error> = async ()=>false;
    
    public useImplications(implications:Implications<R,P>):void {
        const rules = implications.rules;
        const rKeys = Object.keys(rules);
        this.isItImplied = async (fallback,relation,statement,visitedCombinations):Promise<boolean | Result.error> => {//this is a pattern to query rules with the same interface design as querying a fact
            const predicates = await this.predicates();
            for (const rKey of rKeys) {
                const queryKey = predicates[relation] || relation;
                const routeKey = predicates[rKey] || rKey;
                if (queryKey === routeKey) {
                    try {
                        const validator = implications.statements[rKey as R]();
                        const ruleFucntion = rules[rKey as R];
                        validator.parse(statement);
                        return await ruleFucntion(this as any,statement,visitedCombinations || [ [] ]);

                    }catch(err:unknown) {
                        if (err instanceof ZodError) {
                            const errors = JSON.parse(err.message) as Error[];
                            const error = '\n' + errors.map(error=>'-' + error.message + '.').join('\n');
                            console.log(chalk.red.underline('\nStatement validation error:'),error,'\n');
                            console.log(chalk.red.underline('Details:\n'),err,'\n');
                        }else {
                            console.log(chalk.red.underline(`\nThe rule '${rKey}' encountered an error:`));
                            console.log((err as Error).message + '\n');
                            console.log(chalk.red.underline('Details:\n'),err,'\n');
                        }
                        return Result.error;
                    }
                }
            }
            return await this.isItStated(fallback,relation,statement);
        };
    };//the reason why i made this to take the relations query Q instead of predicates P is to have full intellisese of all the possible relations to ask regardless if its for a fact or an implication
    public isItStated = async(checkMode:FactCheckMode,relation:P | R,statement:L):Promise<boolean>=> {
        const result:Result.error | boolean = await client.request("isItStated",{predicate:relation,statement,byMembership:checkMode}) ;
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    //It is intended that the members type generated in the output should be passed as T.this will let ts to treat the wildcard as a valid memeber of the document even though it isnt explicitly written
    public wildCard = async():Promise<M>=>{
        return (await client.request('wildCard',{})) as M;//this one can not return a doc error because its a static property thats always available on the server
    };
    public allMembers = async ():Promise<L>=>{
        const result:Result.error | L = await client.request('allMembers',{});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    public predicates = async ():Promise<Record<string,string>>=>{
        const result:Result.error | Record<string,string> = await client.request('predicates',{});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    public findAllFacts = async (checkMode:FactCheckMode,predicate:P,statement:L):Promise<L[]>=>{
        const result:Result.error | L[] = await client.request("findAllFacts",{predicate,statement,byMembership:checkMode});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    public findFirstNFacts = async (checkMode:FactCheckMode,num:number,predicate:P,statement:L):Promise<L[]>=> {
        const result:Result.error | L[] = await client.request("findFirstNFacts",{num,predicate,statement,byMembership:checkMode});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    public pullCandidates = async <N extends number>(howManyToReturn:N,predicate:P,inputCombination:L,visitedCombinations:Box<string[]>):Promise<Tuple<M,N>[]>=> {
        await client.request("pullCandidates", { howManyToReturn, predicate, inputCombination, visitedCombinations: visitedCombinations[0] });//initiate the stream request
        return await readStream<Tuple<M,N>,Result.error | GeneratedCandidates<M, N>>((subscriber,value)=>{
            if (value === Result.error) Doc.throwDocError();
            visitedCombinations[0] = value.checkedCombinations;
            subscriber.next(value.combination);
        });
    };
    public selectSmallestRecord = async (predicates:P[]):Promise<P>=> {
        const result:Result.error | P = await client.request('selectSmallestRecord',{predicates});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    public intersection = async (arrays:L[]):Promise<L>=> {
        const result:Result.error | L =  await client.request('intersection',{arrays});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    public printAnswer(answer:boolean):void {
        const text = (answer)?chalk.green('yes'):chalk.red('no');
        console.log(chalk.yellow('\nAnswer: '),text);
    }
    private static throwDocError():never {
        throw new Error(chalk.red('The fact checker was unable to load to the document.'));
    }
}
interface Response<T> {
    finished:boolean,
    value:T
}
interface Info {
    predicates:string,
    keyofRules:string,
    members:Atom,
}
export type Rule<P extends string = ''> = ProceduralRule<P> | RecursiveRule<P>;
export type ProceduralRule<P extends string = ''> = (doc:Doc<P>,statement:any)=>Promise<boolean>;
export type RecursiveRule<P extends string =''> = (doc:Doc<P>,statement:any,visitedCombinations:Box<string[]>)=>Promise<boolean>;//i boxed the visited combinations in an array for direct mutation under the genCandidates method

export type Atom<T extends string | number = string | number> = T;
export type AtomList<T extends string | number> = Atom<T>[];


export interface Implications<K extends string,P extends string> {//The statements property is for validating the input(statement) in a rule before processing.The name of the keys here should match the rules they are meant to be used for validation
    statements:Record<K,()=>zod.ZodType>,//i made it map to arrow functions so that defined validations can be reused for different keys under the same definition
    rules:Record<K,Rule<P>>
}

const factCheckModes = {
    Membership:true,
    ExactMatch:false,
};
export type FactCheckMode = boolean;
export const checkBy = factCheckModes;//to be used in the isItStated method
export const fallbackTo = factCheckModes;//to be used in in the isItImplied method for clarity that the implication check fallbacks to fact checking if the statement isnt explicitly said to be true by a rule.This is more clear than writing check by ... which is because the check mode the caller passes to the implication check doesnt in any way,affect the actual implication process because its explicitly handled by the rules.

export enum Result {
    success='success',
    error='error'
}
export enum NoOutput {
    value=1//i used a number over a string to get better type safety by distinguishing it from string paths.i used 1 not 0 so that the code doesnt mistakenly treat it as a falsy value
}
export interface ResolutionResult {
    result:Result,
    jsonPath:string | NoOutput | undefined,
}
export type Tuple<T, N extends number, R extends unknown[] = []> = 
    R['length'] extends N ? R : Tuple<T, N, [...R, T]>;

export interface GeneratedCandidates<T extends string | number,N extends number> {
    combination:Tuple<Atom<T>,N>,
    checkedCombinations:string[]
}
export type Box<T> = [T];

