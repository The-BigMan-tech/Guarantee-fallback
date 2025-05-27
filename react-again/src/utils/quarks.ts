export function roundToTwo(num:number):number {
    return Math.round(num * 100) / 100;
}
function removeAllDots(str:string):string {
    return str.replace(/\./g, '');
}
function removeAllSpaces(str:string):string {
    return str.replace(/\s+/g, '');
}
export function normalizeString(str:string):string {
    return removeAllSpaces(removeAllDots(str).trim().toLowerCase());
}
export function aggressiveFilter(str:string | null,query:string):boolean {
    if (str) {
        const normalizedStr = normalizeString(str);
        const normalizedQuery = normalizeString(query)
        return normalizedStr.includes(normalizedQuery)
    }
    return false
}

