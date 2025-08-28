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
export async function resolveDoc(filePath:string):Promise<ResolutionResult> {
    const result = await client.request("resolveDocToJson",{filePath,outputFolder:NoOutput.value}) as ResolutionResult;
    return result;
}

export class Doc {//i used arrow methods so that i can have these methods as properties on the object rather than methods.this will allow for patterns like spreading
    public findAllFacts = async (predicate:string,statement:PatternedAtomList,byMembership=false):Promise<(false | AtomList)[]>=>{
        return await client.request("findAllFacts",{predicate,statement,byMembership});
    };
    public findFirstFact = async (predicate:string,statement:PatternedAtomList,byMembership=false):Promise<false | AtomList>=> {
        return await client.request("findFirstFact",{predicate,statement,byMembership});
    };
    public isItAFact = async(predicate:string,statement:PatternedAtomList,byMembership=false):Promise<boolean>=> {
        return await client.request("isItAFact",{predicate,statement,byMembership});
    };
    public genCandidates = async <T extends Atom,N extends number>(howManyToReturn:N,predicate:string,inputCombination:Atom[],visitedCombinations:string[]):Promise<{candidates:T[][],checkedCombinations:string[]}>=>{
        return await client.request("genCandidates",{howManyToReturn,predicate,inputCombination,visitedCombinations});
    };
    public selectSmallestRecord = async (predicates:string[]):Promise<string>=> {
        return await client.request('selectSmallestRecord',{predicates});
    };
    public intersection = async (arrays:(Atom | undefined)[][]):Promise<Atom[]>=> {
        return await client.request('intersection',{arrays});
    };
    public wildCard = async ():Promise<string>=>{
        return await client.request('wildCard',{});
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
    value='no-output'
}
export interface ResolutionResult {
    result:Result,
    jsonPath:string | NoOutput | Result.error;
}