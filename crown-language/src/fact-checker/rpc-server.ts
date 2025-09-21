import chalk from "chalk";
import ipc from 'node-ipc';
import { JSONRPCServer } from "json-rpc-2.0";
import stringify from "safe-stable-stringify";
import { Doc } from "./fact-checker.js";
import {autoComplete, findDefLocation, getHoverInfo, importDocFromJson, importDocFromObject, importDocFromSrc} from "../resolver/functions.js";
import { Atom, AtomList, isGenerator,Result} from "../utils/utils.js";
import {serverDoc} from "./fact-checker.js";
import { analyzeDocument, resolveDocument } from "../resolver/functions.js";
import {Mutex} from 'async-mutex';

const server = new JSONRPCServer();
const mutex = new Mutex();

server.addMethod("importDocFromSrc", async ({ filePath, outputFolder }: { filePath: string; outputFolder: string }) => {
    const result = await importDocFromSrc(filePath, outputFolder);
    return result;
});
server.addMethod("importDocFromJson", async ({ filePath}: { filePath: string }) => {
    const result = await importDocFromJson(filePath);
    return result;
});
server.addMethod("importDocFromObject", async ({ obj }: {obj: Record<string,any> }) => {
    const result = await importDocFromObject(obj);
    return result;
});
server.addMethod("resolveDocument", async ({ filePath, outputFolder }: { filePath: string; outputFolder: string}) => {
    const {result} = await resolveDocument(filePath, outputFolder);
    return result;
});
server.addMethod("analyzeDocument", async ({srcText,srcPath}: {srcText:string,srcPath:string}) => {
    const result = await analyzeDocument(srcText,srcPath);
    return result;
});
server.addMethod("autoComplete",({word}: {word:string}) => {
    const result = autoComplete(word);
    return result;
});
server.addMethod("getHoverInfo",({line,hoverText}: {line:number,hoverText:string}) => {
    const result = getHoverInfo(line,hoverText);
    return result;
});
server.addMethod("findDefLocation",({line,word}: {line:number,word:string}) => {
    const result = findDefLocation(line,word);
    console.log('🚀 => :42 => Def location result:', result);
    return result;
});
server.addMethod("allMembers",()=>{
    const doc = serverDoc[0];
    if (!doc) return Result.error;
    return doc.allMembers;
});
server.addMethod("predicates",()=>{
    const doc = serverDoc[0];
    if (!doc) return Result.error;
    console.log('🚀 => :30 => docOnServer.aliases:', doc.predicates);
    return doc.predicates;
});
server.addMethod('wildCard',()=>{
    return Doc.wildCard;
});
server.addMethod("findAllFacts",({predicate,statement,byMembership}:{predicate:string,statement:AtomList,byMembership:boolean})=>{
    const doc = serverDoc[0];
    if (!doc) return Result.error;
    const result = doc.consumeAllFacts(doc.records[predicate],statement,byMembership);
    return result;
});
server.addMethod("findFirstNFacts",({num,predicate,statement,byMembership}:{num:number,predicate:string,statement:AtomList,byMembership:boolean})=>{
    const doc = serverDoc[0];
    if (!doc) return Result.error;
    const result = doc.findFirstNFacts(num,doc.records[predicate],statement,byMembership);
    return result;
});
server.addMethod("isItStated",({predicate,statement,byMembership}:{predicate:string,statement:AtomList,byMembership:boolean})=>{
    const doc = serverDoc[0];
    if (!doc) return Result.error;
    const result = doc.isItStated(doc.records[predicate],statement,byMembership);
    return result;
});
server.addMethod("pullCandidates",function* ({howManyToReturn,predicate,inputCombination,visitedCombinations}:{howManyToReturn: number,predicate:string, inputCombination:Atom[], visitedCombinations:string[]}) {
    const doc = serverDoc[0];
    if (!doc) return Result.error;
    const visitedSet = new Set(visitedCombinations);
    for (const combination of doc.pullCandidates(howManyToReturn,doc.records[predicate],inputCombination,visitedSet)) {
        yield {combination,checkedCombinations:Array.from(visitedSet)};//stream the data to the client
    }
});
server.addMethod("selectSmallestRecord",({predicates}:{predicates:string[]})=>{
    const doc = serverDoc[0];
    if (!doc) return Result.error;
    const relevantRecords = predicates.map(predicate=>doc!.records[predicate]);
    const smallestRecord = Doc.selectSmallestRecord(...relevantRecords);
    for (const predicate of predicates) {
        if (doc.records[predicate] === smallestRecord) {
            return predicate;
        }
    }
});
async function handleRequest(data:any,socket:any):Promise<void> {
    const response = await server.receive(data);//route request to the appropriate controller
    const result = response?.result;
    if (isGenerator(result)) {//this block streams the results froma generator
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
}
function correctObjProperty(data:any):void {
    const obj = data.params?.obj;
    if (obj) {
        const defaultProp = 'default' in obj;//this is to handle js environment differences like between swc and jiti
        data.params.obj = (defaultProp)?obj['default']:obj;
    }
}
export async function startIPCServer(): Promise<void> {
    ipc.config.id = 'crown-ipc-server';
    ipc.config.silent = false;

    ipc.serve(() => {
        ipc.server.on('message', async (data, socket) => {//receive request from the client
            try {
                const release = await mutex.acquire();
                try {
                    correctObjProperty(data);
                    await handleRequest(data,socket);
                }finally {
                    release();
                }
            } catch (err) {
                console.error('Error handling JSON-RPC request:', err);
            }
        });
    });
    ipc.server.start();
    console.log(chalk.green(`The crown fact checker is listening with the id '${ipc.config.id}'`));
}
