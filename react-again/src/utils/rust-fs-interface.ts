import { invoke } from '@tauri-apps/api/core';

export interface FsPrimaryData {
    nodeType:'File' | 'Folder'  
    nodeName: string,    
    nodePath:string,     
    fileExtension:string | null,
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
    public value:T ;
    constructor(value:T) {
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
    }else if (!(fileExtension)) {
        return "folder-solid.svg"//path to folder icon
    }else {//file icon path is at the else instead of folder cuz i cant exhuast all posssible file types before writing the folder path under else
        return "file-solid.svg"
    }
}
async function getFsNode(nodePath:string): Promise<FsNode> {
    const metadata:FsMetadata =  await invoke('fs_stat', {path:nodePath});
    const nodeName:string = await invoke('path_basename', {path:nodePath});
    const fileExtension:string | null = await invoke('path_extname', {path:nodeName})
    const isHidden:boolean = nodeName.startsWith(".");
    const iconPath:string = getFsIcon(fileExtension);
    return {
        primary:{
            nodeType:(fileExtension)?'File':'Folder',
            nodeName,
            nodePath,
            fileExtension,
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
export async function base_name(path:string):Promise<string> {
    return await invoke('path_basename', {path});
}
export async function readDirectory(dirPath:string):Promise<FsResult<FsNode[] | null | Error>> {
    try {
        const fsNodePaths:string[] = await invoke('read_dir', { dirPath });
        const fsNodesPromise:(Promise<FsNode>)[] = fsNodePaths.map(async (fsNodePath) =>await getFsNode(fsNodePath))
        const fsNodes:FsNode[] = await Promise.all(fsNodesPromise);
        return (fsNodes.length)?FsResult.Ok(fsNodes):FsResult.Ok(null);
    }catch(error:unknown) {
        return FsResult.Err(error)
    }
}
export async function readFile(filePath: string): Promise<FsResult<string | null | Error>> {
    try {
        const content:string = await invoke('read_file', {path:filePath});
        return (content)?FsResult.Ok(content):FsResult.Ok(null);
    } catch (error: unknown) {
        return FsResult.Err(error);
    }
}