import fs from 'node:fs/promises'
import path from 'node:path';

export interface File {
    fullName: string,       
    extension:string,
    content:'unread' | string,
    size: number, 
    filePath:string,    
    iconPath:string,
    modifiedDate: Date,
    createdDate:Date,
    accessedDate:Date,
    isHidden:boolean
    isReadOnly:boolean
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
async function getFileObject(filePath:string,content:'unread' | string): Promise<File> {
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    return {
        fullName:fileName,
        extension:path.extname(fileName),
        content:content,
        size: stats.size,
        filePath: filePath,
        iconPath: '',
        modifiedDate: stats.mtime,
        createdDate: stats.birthtime,
        accessedDate: stats.atime,
        isHidden: fileName.startsWith('.'),
        isReadOnly: !(stats.mode & 0o200), 
    };
}
export async function readDirectory(dirPath:string):Promise<FsResult<File[] | null | Error>> {
    try {
        const filePaths:string[] = await fs.readdir(dirPath);
        const fileObjects = filePaths.map(async (fileName) => {
            const filePath = path.join(dirPath,fileName);
            return await getFileObject(filePath,'unread')
        })
        const files: File[] = await Promise.all(fileObjects);
        return (files.length)?FsResult.Ok(files):FsResult.Ok(null);
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
export async function deleteFile(filePath: string): Promise<FsResult<null | Error>> {
    try {
        await fs.unlink(filePath);
        return FsResult.Ok(null)
    } catch (error: unknown) {
        return FsResult.Err(error);
    }
}
export async function renameFile(oldPath: string, newPath: string): Promise<FsResult<null | Error>> {
    try {
        await fs.rename(oldPath, newPath);
        return FsResult.Ok(null)
    } catch (error: unknown) {
        return FsResult.Err(error);
    }
}
export async function copyFile(source: string, destination: string): Promise<FsResult<null | Error>> {
    try {
        await fs.copyFile(source, destination);
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