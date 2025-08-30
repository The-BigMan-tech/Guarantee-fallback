import ipc from 'node-ipc';
import chalk from "chalk";
import path from "path";
import fs from "fs/promises";
import { JSONRPCClient } from "json-rpc-2.0";


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
                const jsonRPCResponse = JSON.parse(data);
                client.receive(jsonRPCResponse);//hanlde the response
            } catch (err) {
                throw new Error(String(err));
            } finally {
                ipc.disconnect(ipcServerID);
            }
        });
        server.on('error',():never => {
            throw new Error(chalk.red('The server encountered an error or it may not have been started.'));
        });
    });
});
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

export async function importDocFromPath<M extends Atom,P extends string,R extends string>(filePath:string,outputFolder?:string):Promise<Doc<M,P,R> | undefined> {
    const result = await client.request("importDocFromPath",{filePath,outputFolder}) as Result;
    if (resolutionErr(result)) return;
    console.log(chalk.green('\nSuccessfully loaded the document onto the server.'));
    return new Doc<M,P,R>();
}
export async function importDocFromObject<M extends Atom,P extends string,R extends string>(obj:Record<string,any>):Promise<Doc<M,P,R> | undefined> {
    const result = await client.request("importDocFromObject",{obj}) as Result;
    if (resolutionErr(result)) return;
    console.log(chalk.green('\nSuccessfully loaded the document onto the server.'));
    return new Doc<M,P,R>();
}
//this binding is intended for the lsp to use to get analysis report without affecting the ipc server
export async function resolveDoc(filePath:string,outputFolder?:string | NoOutput):Promise<ResolutionResult | undefined> {
    const resolutionResult = await client.request("resolveDocToJson",{filePath,outputFolder:outputFolder}) as ResolutionResult;
    if (resolutionErr(resolutionResult.result)) return;
    console.log(chalk.green('\nSuccessfully resolved the document.'));
    return resolutionResult;
}
export async function genTypes<K extends string>(docName:string,outputFolder:string,doc:Doc,rules?:Record<K,Rule>):Promise<void> {
    const union = ' | ';
    const terminator = ";\n";
    const exportType = (name:string):string=>`export type ${name} =`;

    const typeFile = docName + '.types.ts';
    const typeFilePath = path.join(outputFolder,typeFile);
    
    const memberUnion =  (await doc.allMembers()).map(member=>`"${member}"`).join(union);
    const memberDeclaration = `${exportType('members')} ${memberUnion}`;
    await fs.writeFile(typeFilePath,memberDeclaration + terminator);

    const predicates = new Set<string>();
    Object.entries(await doc.aliases()).forEach(([alias,predicate])=>{
        predicates.add(alias);
        predicates.add(predicate);
    });

    const predicatesUnion = Array.from(predicates).map(predicate=>`"${predicate}"`).join(union);
    const predicatesDeclaration = `${exportType('predicates')} ${predicatesUnion}`;
    await fs.appendFile(typeFilePath,predicatesDeclaration + terminator);

    if (rules) {
        const rulesUnion = (rules)?Object.keys(rules).map(rKey=>`"${rKey}"`).join(union):'';
        const rulesDeclaration = `${exportType('keyofRules')} ${rulesUnion}`;
        await fs.appendFile(typeFilePath,rulesDeclaration + terminator);
    }
    console.log(chalk.green('Sucessfully generated the types at: '),typeFilePath);
}
//this takes in a .fog src file,an output folder and the rules.It then loads the document on the server as well as generating the types
export async function setupOutput<K extends string>(srcFilePath:string,outputFolder:string,rules:Record<K,Rule>):Promise<void> {
    const doc = await importDocFromPath(srcFilePath,outputFolder);
    const docName = path.basename(srcFilePath,path.extname(srcFilePath));
    if (doc) await genTypes(docName,outputFolder,doc,rules);
}
export class Doc<
    M extends Atom = Atom,//these are the Members of the document.Its a uniontype
    P extends string=string,//these are the Predicates or aliases.
    R extends string=string,//the union of all the keys in a Rule
    L =AtomList<M>//the List of all the members
    > {
    //i used arrow methods so that i can have these methods as properties on the object rather than methods.this will allow for patterns like spreading    
    //this method allows the user to query for the truthiness of a statement of a rule the same way they do with facts.So that rather than calling methods directly on the rule object,they write the name of the rule they want to check against as they would for fact querying and this method will forward it to the correct rule by key.It also includes aliases allowing users to also query rules with aliases that will still forward to the correct rule even though the rule's name isnt the alias.
    //this is recommended to use for querying rather direct function calls on a rule object but use the rule object to directly build functions or other rules for better type safety and control and use this mainly as a convenience for querying.
    //it will also fallback to direct fact checking if the statement doesnt satisfy any of the given rules making it a good useful utility for querying the document against all known facts and rules with alias support in a single call.Rules will be given priority first over direct fact checking because this method unlike isItAFact is designed for checking with inference.The check mode is used as part of the fallback to fact querying
    public isItImplied:(relation:P | R,statement:L)=>Promise<boolean> = async ()=>false;
    
    public useRules(rules:Record<R,Rule>):void {
        const rKeys = Object.keys(rules);
        this.isItImplied = async (relation,statement):Promise<boolean> => {//this is a pattern to query rules with the same interface design as querying a fact
            const aliases = await this.aliases();
            for (const rKey of rKeys) {
                const queryKey = aliases[relation] || relation;
                const forwardKey = aliases[rKey] || rKey;
                const ruleFucntion = rules[rKey as R];
                if (queryKey === forwardKey) {
                    return await ruleFucntion(this as any,statement,[]);
                }
            }
            return false;
        };
    };//the reason why i made this to take the relations query Q instead of predicates P is to have full intellisese of all the possible relations to ask regardless if its for a fact or an implication
    public isItStated = async(relation:P | R,statement:L,checkMode:Check):Promise<boolean>=> {
        const result:Result.error | boolean = await client.request("isItAFact",{predicate:relation,statement,byMembership:Boolean(checkMode)});
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
    public aliases = async ():Promise<Record<string,string>>=>{
        const result:Result.error | Record<string,string> = await client.request('aliases',{});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    public findAllFacts = async (predicate:P,statement:L,checkMode:Check):Promise<L[]>=>{
        const result:Result.error | L[] = await client.request("findAllFacts",{predicate,statement,byMembership:Boolean(checkMode)});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    public findFirstNFacts = async (num:number,predicate:P,statement:L,checkMode:Check):Promise<L[]>=> {
        const result:Result.error | L[] = await client.request("findFirstNFacts",{num,predicate,statement,byMembership:Boolean(checkMode)});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    public genCandidates = async <N extends number>(howManyToReturn:N,predicate:P,inputCombination:L,visitedCombinations:string[]):Promise<GeneratedCandidates<M>>=>{
        const result:Result.error | GeneratedCandidates<M> =  await client.request("genCandidates",{howManyToReturn,predicate,inputCombination,visitedCombinations});
        if (result === Result.error) Doc.throwDocError();
        return result;
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
export type Rule = ProceduralRule | RecursiveRule;
export type ProceduralRule<T extends AtomList<Atom>=any> = (doc:Doc,statement:T)=>Promise<boolean>;
export type RecursiveRule<T extends AtomList<Atom>=any> = (doc:Doc,statement:T,visitedCombinations:string[])=>Promise<boolean>;

export type Atom<T extends string | number = string | number> = T;
export type AtomList<T extends string | number> = Atom<T>[];

export enum Result {
    success='success',
    error='error'
}
export enum Check {
    byMembership=1,
    byExactMatch=0
}
export enum NoOutput {
    value=1//i used a number over a string to get better type safety by distinguishing it from string paths.i used 1 not 0 so that the code doesnt mistakenly treat it as a falsy value
}
export interface ResolutionResult {
    result:Result,
    jsonPath:string | NoOutput | undefined,
}
export interface GeneratedCandidates<T extends string | number> {
    candidates:AtomList<T>[],
    checkedCombinations:string[]
}
