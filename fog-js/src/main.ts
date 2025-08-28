import ipc from 'node-ipc';
import chalk from "chalk";
import { JSONRPCClient } from "json-rpc-2.0";


const client = new JSONRPCClient((jsonRPCRequest) =>
    new Promise((resolve, reject) => {
        ipc.config.silent = true;
        
        ipc.connectTo('fog-ipc-server', () => {
            const server = ipc.of['fog-ipc-server']; 
            server.on('connect', () => {//make the request.the request should not be stringified
                server.emit('message',jsonRPCRequest);
            });
            server.on('message', (data: string) => {//get the response
                try {
                    const jsonRPCResponse = JSON.parse(data);
                    // console.log(chalk.cyan('Response: '),jsonRPCResponse);
                    resolve(client.receive(jsonRPCResponse));//hanlde the response
                } catch (err) {
                    reject(err);
                } finally {
                    ipc.disconnect('fog-ipc-server');
                }
            });
            server.on('error', reject);
        });
    })
);
export async function importDoc(filePath:string,outputFolder?:string):Promise<Doc | undefined> {
    const result = await client.request("importDoc",{filePath,outputFolder}) as Result;
    if (result === Result.error) {
        console.log(chalk.red("An error occurred while importing the document.See the server."));
        console.log(chalk.yellow("You may also want to check the .ansi log at the output folder with an ansi file previewer if generated."));
        return;
    }
    return new Doc();
}
export async function resolveDoc(filePath:string,outputFolder?:string | NoOutput):Promise<ResolutionResult> {
    const result = await client.request("resolveDocToJson",{filePath,outputFolder:outputFolder}) as ResolutionResult;
    return result;
}

export class Doc {//i used arrow methods so that i can have these methods as properties on the object rather than methods.this will allow for patterns like spreading
    private static throwDocError():never {
        throw new Error(chalk.red('The document was unable to load to the fact checker.'));
    }
    public aliases = async ():Promise<Record<string,string>>=>{
        const result:Result.error | Record<string,string> = await client.request('aliases',{});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    public findAllFacts = async (predicate:string,statement:PatternedAtomList,byMembership=false):Promise<(false | AtomList)[]>=>{
        const result:Result.error | (false | AtomList)[] = await client.request("findAllFacts",{predicate,statement,byMembership});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    public findFirstFact = async (predicate:string,statement:PatternedAtomList,byMembership=false):Promise<false | AtomList>=> {
        const result:Result.error | false | AtomList = await client.request("findFirstFact",{predicate,statement,byMembership});
        if (result === Result.error) Doc.throwDocError();
        return result;
    };
    public isItAFact = async(predicate:string,statement:PatternedAtomList,byMembership=false):Promise<boolean>=> {
        const result:Result.error | boolean = await client.request("isItAFact",{predicate,statement,byMembership});
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
    public wildCard = async ():Promise<string>=>{
        return await client.request('wildCard',{});//this one can not return a doc error because its a static property thats always available on the server
    };
}
export type Rule<T extends AtomList> = (doc:Doc,statement:T)=>Promise<boolean>;
export type RecursiveRule<T extends AtomList> = (doc:Doc,statement:T,visitedCombinations:string[])=>Promise<boolean>;

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