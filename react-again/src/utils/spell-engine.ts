import nspell from "nspell"

const affResponse = await fetch('/dictionaries/en_GB.aff');
const aff = await affResponse.text();

const dicResponse = await fetch('/dictionaries/en_GB.dic');
const dic = await dicResponse.text();

export const spellEngine = nspell({ aff, dic });

export const LeetMap:Record<string,string> = {
    '1': 'i',   
    '2': 'z',    
    '3': 'e',   
    '4': 'a',   
    '5': 's',   
    '6': 'g',   
    '7': 't',    
    '8': 'b',    
    '9': 'g',   
    '0': 'o'    
};
export function preprocessQuery(query:string) {
    return query.toLowerCase().split('')
        .map(char => {
            if (char >= 'a' && char <= 'z') {
              return char; // keep letters as is
            }
            return LeetMap[char]?LeetMap[char]: ''; // map or remove
        }).join('');
}