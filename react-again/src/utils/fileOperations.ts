import fs from 'node:fs/promises'
import path from 'node:path';

export interface File {
    fullName: string,       
    extension:string,
    size: number, 
    filePath:string,    
    iconPath:string,
    modifiedDate: Date,
    createdDate:Date,
    accessedDate:Date,
    isHidden:boolean
    isReadOnly:boolean
}
async function getFileObject(filePath:string): Promise<File> {
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    return {
        fullName:fileName,
        extension:path.extname(fileName),
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
class FsResult<T>  {
    public value:Error | T | null ;
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
export async function readDirectory(dirPath:string):Promise<FsResult<File[] | null | Error>> {
    try {
        const filePaths:string[] = await fs.readdir(dirPath);
        const fileObjects = filePaths.map(async (fileName) => {
            const filePath = path.join(dirPath,fileName);
            return await getFileObject(filePath)
        })
        const files: File[] = await Promise.all(fileObjects);
        return (files.length)?FsResult.Ok(files):FsResult.Ok(null);
    }catch(error:unknown) {
        return FsResult.Err(error)
    }
}
async function sample() {
    const dirInput = "C:\\Users\\USER\\Desktop\\dummy-code\\Guarantee\\react-again\\src\\utils";
    const filesResult:FsResult<File[] | null | Error> = await readDirectory(dirInput);
    const files:File[] = filesResult.value
    if (!(filesResult.value instanceof Error)) {
        if (filesResult.value != null) {
            const files:File[] = filesResult.value
            console.log("Files:",files);
        }else {
            console.log("Directory exists but there are no files in it");
        }
    }else {
        console.log(`Error occured while reading from the dir: ${dirInput}: `,filesResult.value.message);
    }
}
sample()