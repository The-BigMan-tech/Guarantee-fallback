import { invoke } from '@tauri-apps/api/core';

export interface FsPrimaryData {
    nodeType:'File' | 'Folder'  
    nodeName: string,    
    nodePath:string,     
    fileExtension:string | null,
    content:'files' | 'pending' | string,
    iconPath:string,
}
export interface FsMetadata {
    sizeInBytes:number,
    modifiedDate:Date,
    createdDate:Date,
    accessedDate:Date,
    isReadOnly:boolean,
}
export interface FsNode {
    primary:FsPrimaryData,
    metadata:FsMetadata,
    isHidden:boolean
}
export class FsResult<T>  {
    public value:Error | null | T ;
    constructor(value:Error | null | T) {
        this.value = value
    }
    static Ok<U>(value:U) {
        return new FsResult(value)
    }
    static Err(error:unknown) {
        return new FsResult((error instanceof Error)?error:new Error("An unknown error occurred"))
    }
}
function getFsIcon(fileExtension:string | null):string {
    if (fileExtension === "png") {
        return ""//path to png icon
    }else {
        return ""//path to folder icon
    }
}
function getFsContent(fsContent:string | null,hasFileExtension:boolean):string {
    if (fsContent) {
        return fsContent
    }else if  (!(fsContent) && hasFileExtension) {
        return 'pending'
    }else {
        return 'files'
    }
}
async function getFsNode(nodePath:string,fsContent:string | null): Promise<FsNode> {
    const metadata:FsMetadata =  await invoke('fs_stat', {path:nodePath});
    const nodeName:string = await invoke('path_basename', {path:nodePath});
    const fileExtension:string | null = await invoke('path_extname', {path:nodeName})
    const isHidden:boolean = nodeName.startsWith(".");
    const iconPath:string = getFsIcon(fileExtension);
    const content:string = getFsContent(fsContent,Boolean(fileExtension))
    return {
        primary:{
            nodeType:(fileExtension)?'File':'Folder',
            nodeName,
            nodePath,
            fileExtension,
            content,
            iconPath
        },
        metadata,
        isHidden
    }
}
export async function join_with_home(tabName:string):Promise<string> {
    const path_from_home:string = await invoke('join_with_home', {tabName});
    return path_from_home
}
export async function readDirectory(dirPath:string):Promise<FsResult<FsNode[] | null | Error>> {
    try {
        const nodePaths:string[] = await invoke('read_dir', { dirPath });
        const fsNodesPromise = nodePaths.map(async (nodePath) =>await getFsNode(nodePath,null))
        const fsNodes: FsNode[] = await Promise.all(fsNodesPromise);
        return (fsNodes.length)?FsResult.Ok(fsNodes):FsResult.Ok(null);
    }catch(error:unknown) {
        return FsResult.Err(error)
    }
}
export async function readFile(filePath: string): Promise<FsResult<File | null | Error>> {
    try {
        const content:string  = await fs.readFile(filePath, 'utf-8');
        const file:File = await getFileObject(filePath,content);
        return (content)?FsResult.Ok(file):FsResult.Ok(null);
    } catch (error: unknown) {
        return FsResult.Err(error);
    }
}
export async function writeFile(filePath: string, content: string): Promise<FsResult<null | Error>> {
    try {
        await fs.writeFile(filePath, content, 'utf-8');
        return FsResult.Ok(null)
    } catch (error: unknown) {
        return FsResult.Err(error);
    }
}

export async function sample() {
    const dirInput = "C:\\Users\\USER\\Desktop\\dummy-code\\Guarantee\\react-again\\src\\utils";
    const filesResult:FsResult<File[] | null | Error> = await readDirectory(dirInput);
    if (filesResult.value instanceof Error) {
        console.log(`Error occured while reading from the dir: ${dirInput}: `,filesResult.value.message);
    }else if (filesResult.value == null) {
        console.log("Directory exists but there are no files in it");
    }else {
        const files:File[] = filesResult.value
        console.log("Files:",files);
    }
    const writeResult:FsResult<null | Error> = await writeFile(`${dirInput}\\hello.txt`,"hello file");
    if (writeResult.value instanceof Error) {
        console.log("An error occurred while trying to write to the file: ",writeResult.value);
    }else {
        console.log("File written to successfully");
    }
    const readResult:FsResult<File | null | Error> = await readFile(`${dirInput}\\hello.txt`);
    if (readResult.value instanceof Error) {
        console.log("Error when reading the file",readResult.value);
    }else if (readResult.value == null){
        console.log("The file is empty");
    }else {
        const content:string = readResult.value.content;
        console.log("File content",content);
        console.log("Read file: ",readResult.value);
    }
}