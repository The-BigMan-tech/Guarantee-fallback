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

export async function importDocFromPath<U extends string,T extends PatternedAtomList>(filePath:string,outputFolder?:string):Promise<Doc<U,T> | undefined> {
    const result = await client.request("importDocFromPath",{filePath,outputFolder}) as Result;
    if (resolutionErr(result)) return;
    console.log(chalk.green('\nSuccessfully loaded the document onto the server.'));
    return new Doc<U,T>();
}
export async function importDocFromObject<U extends string,T extends PatternedAtomList>(obj:Record<string,any>):Promise<Doc<U,T> | undefined> {
    const result = await client.request("importDocFromObject",{obj}) as Result;
    if (resolutionErr(result)) return;
    console.log(chalk.green('\nSuccessfully loaded the document onto the server.'));
    return new Doc<U,T>();
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
    const arr = (elementType:unknown):string =>`(${elementType})[]`;

    const typeFile = docName + '.types.ts';
    const typeFilePath = path.join(outputFolder,typeFile);
    
    const memberUnion =  (await doc.allMembers()).map(member=>`"${member}"`).join(union);
    const memberDeclaration = `${exportType('members')} ${arr(memberUnion)}`;
    await fs.writeFile(typeFilePath,memberDeclaration + terminator);

    const relations = new Set<string>();
    Object.entries(await doc.aliases()).forEach(([alias,predicate])=>{
        relations.add(alias);
        relations.add(predicate);
    });

    const relationsUnion = Array.from(relations).map(relationship=>`"${relationship}"`).join(union);
    const relationsDeclaration = `${exportType('relations')} ${relationsUnion}`;
    await fs.appendFile(typeFilePath,relationsDeclaration + terminator);

    if (rules) {
        const rulesUnion = (rules)?Object.keys(rules).map(rKey=>`"${rKey}"`).join(union):'';
        const rulesDeclaration = `${exportType('rulesUnion')} ${rulesUnion}`;
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
export class Doc<U extends string=string,T extends PatternedAtomList=PatternedAtomList> {//i used arrow methods so that i can have these methods as properties on the object rather than methods.this will allow for patterns like spreading    
    //this method allows the user to query for the truthiness of a statement of a rule the same way they do with facts.So that rather than calling methods directly on the rule object,they write the name of the rule they want to check against as they would for fact querying and this method will forward it to the correct rule by key.It also includes aliases allowing users to also query rules with aliases that will still forward to the correct rule even though the rule's name isnt the alias.
    //this is recommended to use for querying rather direct function calls on a rule object but use the rule object to directly build functions or other rules for better type safety and control and use this mainly as a convenience for querying.
    //it will also fallback to direct fact checking if the statement doesnt satisfy any of the given rules making it a good useful utility for querying the document against all known facts and rules with alias support in a single call.Rules will be given priority first over direct fact checking because this method unlike isItAFact is designed for checking with inference.The check mode is used as part of the fallback to fact querying
    public isItImplied:(relationshipQuery:U,statement:T)=>Promise<boolean> = async ()=>false;
    
    public useRules<K extends string>(rules:Record<K,Rule | RecursiveRule>):void {
        const rKeys = Object.keys(rules);
        this.isItImplied = async (relationshipQuery,statement):Promise<boolean> => {//this is a pattern to query rules with the same interface design as querying a fact
            const aliases = await this.aliases();
            for (const rKey of rKeys) {
                const queryKey = aliases[relationshipQuery] || relationshipQuery;
                const forwardKey = aliases[rKey] || rKey;
                const ruleFucntion = rules[rKey as K];
                if (queryKey === forwardKey) {
                    return await ruleFucntion(this as any,statement,[]);
                }
            }
            return false;
        };
    };
    public isItStated = async(predicate:U,statement:T,checkMode:Check):Promise<boolean>=> {
        const result:Result.error | boolean = await client.request("isItAFact",{predicate,statement,byMembership:Boolean(checkMode)});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    //It is intended that the members type generated in the output should be passed as T.this will let ts to treat the wildcard as a valid memeber of the document even though it isnt explicitly written
    public wildCard = async():Promise<T[number]>=>{
        return (await client.request('wildCard',{})) as T[number];//this one can not return a doc error because its a static property thats always available on the server
    };
    public printAnswer(answer:boolean):void {
        const text = (answer)?chalk.green('yes'):chalk.red('no');
        console.log(chalk.yellow('\nAnswer: '),text);
    }
    private static throwDocError():never {
        throw new Error(chalk.red('The fact checker was unable to load to the document.'));
    }
    public allMembers = async ():Promise<AtomList>=>{
        const result:Result.error | AtomList = await client.request('allMembers',{});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    public aliases = async ():Promise<Record<string,string>>=>{
        const result:Result.error | Record<string,string> = await client.request('aliases',{});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    public findAllFacts = async (predicate:string,statement:PatternedAtomList,checkMode:Check):Promise<AtomList[]>=>{
        const result:Result.error | AtomList[] = await client.request("findAllFacts",{predicate,statement,byMembership:Boolean(checkMode)});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    public findFirstNFacts = async (num:number,predicate:string,statement:PatternedAtomList,checkMode:Check):Promise<AtomList[]>=> {
        const result:Result.error | AtomList[] = await client.request("findFirstNFacts",{num,predicate,statement,byMembership:Boolean(checkMode)});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    public genCandidates = async <T extends Atom,N extends number>(howManyToReturn:N,predicate:string,inputCombination:Atom[],visitedCombinations:string[]):Promise<GeneratedCandidates<T>>=>{
        const result:Result.error | GeneratedCandidates<T> =  await client.request("genCandidates",{howManyToReturn,predicate,inputCombination,visitedCombinations});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    public selectSmallestRecord = async (predicates:string[]):Promise<string>=> {
        const result:Result.error | string = await client.request('selectSmallestRecord',{predicates});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    public intersection = async (arrays:(Atom | undefined)[][]):Promise<Atom[]>=> {
        const result:Result.error | Atom[] =  await client.request('intersection',{arrays});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
}
export type Rule = ProceduralRule | RecursiveRule;
export type ProceduralRule<T=any> = (doc:Doc,statement:T)=>Promise<boolean>;
export type RecursiveRule<T=any> = (doc:Doc,statement:T,visitedCombinations:string[])=>Promise<boolean>;

export type WildCard = string;
export type Atom = string | number;
export type AtomList = Atom[];
export type PatternedAtomList = AddUnionToElements<AtomList,WildCard>;
export type AddUnionToElements<T extends readonly any[], U> = {
    [K in keyof T]: T[K] | U;
};
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
export interface GeneratedCandidates<T> {
    candidates:T[][],
    checkedCombinations:string[]
}
