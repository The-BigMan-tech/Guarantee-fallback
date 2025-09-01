import chalk from "chalk";
import ipc from 'node-ipc';
import { JSONRPCServer } from "json-rpc-2.0";
import stringify from "safe-stable-stringify";
import { Doc, importDocFromObject, importDocFromPath } from "./fact-checker.js";
import { Atom, AtomList, isGenerator, NoOutput,Result} from "../utils/utils.js";
import {docOnServer} from "./fact-checker.js";
import { resolveDocToJson } from "../resolver/resolver.js";

const server = new JSONRPCServer();
server.addMethod("importDocFromPath", async ({ filePath, outputFolder }: { filePath: string; outputFolder?: string }) => {
    const result = await importDocFromPath(filePath, outputFolder);
    return result;
});
server.addMethod("importDocFromObject", async ({ obj }: {obj: Record<string,any> }) => {
    const result = await importDocFromObject(obj);
    return result;
});
server.addMethod("resolveDocToJson", async ({ filePath, outputFolder }: { filePath: string; outputFolder?: string | NoOutput }) => {
    const result = await resolveDocToJson(filePath, outputFolder);
    return result;
});
server.addMethod("allMembers",()=>{
    if (!docOnServer) return Result.error;
    return docOnServer.allMembers;
});
server.addMethod("predicates",()=>{
    if (!docOnServer) return Result.error;
    console.log('🚀 => :30 => docOnServer.aliases:', docOnServer.predicates);
    return docOnServer.predicates;
});
server.addMethod('wildCard',()=>{
    return Doc.wildCard;
});
server.addMethod("findAllFacts",({predicate,statement,byMembership}:{predicate:string,statement:AtomList,byMembership:boolean})=>{
    if (!docOnServer) return Result.error;
    const result = docOnServer.consumeAllFacts(docOnServer.records[predicate],statement,byMembership);
    return result;
});
server.addMethod("findFirstNFacts",({num,predicate,statement,byMembership}:{num:number,predicate:string,statement:AtomList,byMembership:boolean})=>{
    if (!docOnServer) return Result.error;
    const result = docOnServer.findFirstNFacts(num,docOnServer.records[predicate],statement,byMembership);
    return result;
});
server.addMethod("isItStated",({predicate,statement,byMembership}:{predicate:string,statement:AtomList,byMembership:boolean})=>{
    if (!docOnServer) return Result.error;
    const result = docOnServer.isItStated(docOnServer.records[predicate],statement,byMembership);
    return result;
});
server.addMethod("genCandidates",function* ({howManyToReturn,predicate,inputCombination,visitedCombinations}:{howManyToReturn: number,predicate:string, inputCombination:Atom[], visitedCombinations:string[]}) {
    if (!docOnServer) return Result.error;
    const visitedSet = new Set(visitedCombinations);
    for (const combination of docOnServer.genCandidates(howManyToReturn,docOnServer.records[predicate],inputCombination,visitedSet)) {
        yield {combination,checkedCombinations:Array.from(visitedSet)};
    }
});
server.addMethod("intersection",({arrays}:{arrays:any[][]})=>{
    if (!docOnServer) return Result.error;
    const sets = arrays.map(arr=>new Set(arr));
    const result =  [...Doc.intersection(...sets)];
    return result;
});
server.addMethod("selectSmallestRecord",({predicates}:{predicates:string[]})=>{
    if (!docOnServer) return Result.error;
    const relevantRecords = predicates.map(predicate=>docOnServer!.records[predicate]);
    const smallestRecord = Doc.selectSmallestRecord(...relevantRecords);
    for (const predicate of predicates) {
        if (docOnServer.records[predicate] === smallestRecord) {
            return predicate;
        }
    }
});

export async function startIPCServer(): Promise<void> {
    ipc.config.id = 'fog-ipc-server';
    ipc.config.silent = false;

    ipc.serve(() => {
        ipc.server.on('message', async (data, socket) => {//receive request from the client
            try {
                const response = await server.receive(data);//route request to the appropriate controller
                const result = response?.result;
                if (isGenerator(result)) {
                    for await (const value of result) {
                        const responseToClient = stringify({...response,result:{finished:false,value}});
                        ipc.server.emit(socket, 'message', responseToClient); // Send each value to the client
                    }
                    const endResponse = stringify({...response,result:{finished:true,value:null}});
                    ipc.server.emit(socket, 'message',endResponse);//end of streaming
                }else {
                    const responseToClient = stringify({...response,result:{finished:true,value:result}});//the response must be stringified to the client
                    ipc.server.emit(socket, 'message', responseToClient); // Return response back to the client
                }
            } catch (err) {
                console.error('Error handling JSON-RPC request:', err);
            }
        });
    });
    ipc.server.start();
    console.log(chalk.green(`The fog fact checker is listening with the id '${ipc.config.id}'`));
}
