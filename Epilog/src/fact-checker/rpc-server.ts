import chalk from "chalk";
import ipc from 'node-ipc';
import { JSONRPCServer } from "json-rpc-2.0";
import stringify from "safe-stable-stringify";
import { Doc, importDoc } from "./fact-checker.js";
import { Atom, PatternedAtomList} from "../utils/utils.js";
import {docOnServer} from "./fact-checker.js";


const server = new JSONRPCServer();
server.addMethod("importDoc", async ({ filePath, outputFolder }: { filePath: string; outputFolder?: string }) => {
    await importDoc(filePath, outputFolder);
    return;
});
server.addMethod("findAllFacts",({predicate,statement,byMembership}:{predicate:string,statement:PatternedAtomList,byMembership:boolean})=>{
    if (!docOnServer) return;
    const allFacts = [...docOnServer.findAllFacts(docOnServer.records[predicate],statement,byMembership)];
    return allFacts;
});
server.addMethod("findFirstFact",({predicate,statement,byMembership}:{predicate:string,statement:PatternedAtomList,byMembership:boolean})=>{
    if (!docOnServer) return;
    return docOnServer.findFirstFact(docOnServer.records[predicate],statement,byMembership);
});
server.addMethod("isItAFact",({predicate,statement,byMembership}:{predicate:string,statement:PatternedAtomList,byMembership:boolean})=>{
    if (!docOnServer) return;
    return docOnServer.isItAFact(docOnServer.records[predicate],statement,byMembership);
});
server.addMethod("genCandidates",({howManyToReturn,predicate,inputCombination,visitedCombinations}:{howManyToReturn: number,predicate:string, inputCombination:Atom[], visitedCombinations:string[]})=>{
    if (!docOnServer) return;
    return [...docOnServer.genCandidates(howManyToReturn,docOnServer.records[predicate],inputCombination,new Set(visitedCombinations))];
});
server.addMethod("intersection",({sets}:{sets:Set<Atom>[]})=>{
    if (!docOnServer) return;
    Doc.intersection(...sets);
});
server.addMethod("selectSmallestRecord",({predicates}:{predicates:string[]})=>{
    if (!docOnServer) return;
    const records = predicates.map(predicate=>docOnServer!.records[predicate]);
    Doc.selectSmallestRecord(...records);
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
