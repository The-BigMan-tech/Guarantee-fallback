import chalk from "chalk";
import ipc from 'node-ipc';
import { JSONRPCServer } from "json-rpc-2.0";
import stringify from "safe-stable-stringify";
import { Doc, importDoc } from "./fact-checker.js";
import { Atom, PatternedAtomList} from "../utils/utils.js";
import {docOnServer} from "./fact-checker.js";


const server = new JSONRPCServer();
server.addMethod("importDoc", async ({ filePath, outputFolder }: { filePath: string; outputFolder?: string }) => {
    return await importDoc(filePath, outputFolder);
});
server.addMethod("findAllFacts",({predicate,statement,byMembership}:{predicate:string,statement:PatternedAtomList,byMembership:boolean})=>{
    if (!docOnServer) return;
    const result = [...docOnServer.findAllFacts(docOnServer.records[predicate],statement,byMembership)];
    return result;
});
server.addMethod("findFirstFact",({predicate,statement,byMembership}:{predicate:string,statement:PatternedAtomList,byMembership:boolean})=>{
    if (!docOnServer) return;
    const result = docOnServer.findFirstFact(docOnServer.records[predicate],statement,byMembership);
    return result;
});
server.addMethod("isItAFact",({predicate,statement,byMembership}:{predicate:string,statement:PatternedAtomList,byMembership:boolean})=>{
    if (!docOnServer) return;
    const result = docOnServer.isItAFact(docOnServer.records[predicate],statement,byMembership);
    return result;
});
server.addMethod("genCandidates",({howManyToReturn,predicate,inputCombination,visitedCombinations}:{howManyToReturn: number,predicate:string, inputCombination:Atom[], visitedCombinations:string[]})=>{
    if (!docOnServer) return;
    const result = [...docOnServer.genCandidates(howManyToReturn,docOnServer.records[predicate],inputCombination,new Set(visitedCombinations))];
    return result;
});
server.addMethod("intersection",({arrays}:{arrays:[]})=>{
    if (!docOnServer) return;
    const result =  [...Doc.intersection(...arrays.map(arr=>new Set(arr))).values()];
    return result;
});
server.addMethod("selectSmallestRecord",({predicates}:{predicates:string[]})=>{
    if (!docOnServer) return;
    const relevantRecords = predicates.map(predicate=>docOnServer!.records[predicate]);
    const smallestRecord = Doc.selectSmallestRecord(...relevantRecords);
    for (const predicate of predicates) {
        if (docOnServer.records[predicate] === smallestRecord) {
            return predicate;
        }
    }
});
server.addMethod('wildCard',()=>{
    return Doc.wildCard;
});

export async function startIPCServer(): Promise<void> {
    ipc.config.id = 'epilog-ipc-server';
    ipc.config.silent = false;

    ipc.serve(() => {
        ipc.server.on('message', async (data, socket) => {//receive request from the client
            console.log(chalk.cyan('Request: '),data);
            try {
                const response = stringify(await server.receive(data));//route request to the appropriate controller
                if (response) {
                    ipc.server.emit(socket, 'message', response);//return response back to the client.The response must be stringified
                }
            } catch (err) {
                console.error('Error handling JSON-RPC request:', err);
            }
        });
    });
    ipc.server.start();
    console.log(chalk.green(`The epilog fact checker is listening with the id '${ipc.config.id}'`));
}
