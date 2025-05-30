export const heavyFolders:Readonly<Set<string>> = new Set(['node_modules','AppData','.git','src-tauri/target/debug','Recent'])//this will do for now.i will add more later on monitoring the search

export function isFolderHeavy(path:string):boolean {
    const normalizedPath = path.replace(/\\/g, '/');
    for (const heavy of heavyFolders) {
        if (normalizedPath.endsWith(heavy)) {
            return true;
        }
    }
    return false
}