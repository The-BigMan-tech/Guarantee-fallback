import ipc from 'node-ipc';
import chalk from "chalk";
import { JSONRPCClient } from "json-rpc-2.0";


const client = new JSONRPCClient((jsonRPCRequest) =>
    new Promise((resolve, reject) => {
        ipc.config.silent = true;
        
        ipc.connectTo('epilog-ipc-server', () => {
            const server = ipc.of['epilog-ipc-server']; 
            server.on('connect', () => {//make the request.the request should not be stringified
                server.emit('message',jsonRPCRequest);
            });
            server.on('message', (data: string) => {//get the response
                try {
                    const jsonRPCResponse = JSON.parse(data);
                    console.log(chalk.cyan('Response: '),jsonRPCResponse);//hanlde the response
                    resolve(client.receive(jsonRPCResponse));
                } catch (err) {
                    reject(err);
                } finally {
                    ipc.disconnect('epilog-ipc-server');
                }
            });
            server.on('error', reject);
        });
    })
);
export async function importDoc(filePath:string,outputFolder?:string):Promise<Doc | undefined> {
    const loaded = await client.request("importDoc",{filePath,outputFolder}) as boolean | undefined;;
    if (!loaded) {
        console.log(chalk.red("An error occurred while importing the document.See the server"));
        return;
    }
    return new Doc();
}

export class Doc {
    public async findAllFacts(predicate:string,statement:PatternedAtomList,byMembership=false):Promise<(false | AtomList)[]>{
        return await client.request("findAllFacts",{predicate,statement,byMembership});
    }
    public async findFirstFact(predicate:string,statement:PatternedAtomList,byMembership=false):Promise<false | AtomList> {
        return await client.request("findFirstFact",{predicate,statement,byMembership});
    }
    public async isItAFact(predicate:string,statement:PatternedAtomList,byMembership=false):Promise<boolean> {
        return await client.request("isItAFact",{predicate,statement,byMembership});
    }
    public async genCandidates<T extends Atom,N extends number>(howManyToReturn:N,predicate:string,inputCombination:Atom[],visitedCombinations:string[]):Promise<T[][]>{
        return await client.request("genCandidates",{howManyToReturn,predicate,inputCombination,visitedCombinations});
    }
    public async selectSmallestRecord(predicates:string[]):Promise<string> {
        return await client.request('selectSmallestRecord',{predicates});
    }
    public async intersection(sets:Set<Atom | undefined>[]):Promise<Set<Atom>> {
        return await client.request('intersection',{sets});
    }
    public async wildCard():Promise<string> {
        return await client.request('wildCard',{});
    }
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
