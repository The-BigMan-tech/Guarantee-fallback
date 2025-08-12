import { Atoms } from "./fact-checker.ts";
import { parser } from "./parser.js";  // your generated parser
import { Tree } from "@lezer/common";


interface SemanticRep {
    predicate:string,
    atoms:Atoms,
    aliases:string[]
}
export function runAnalyzer() {
    const inputText = `
        'ada' and 'peter' are *friends.
        'peter','jane' and 'billy' are *friends.
    `; 
    const tree:Tree = parser.parse(inputText);
    console.log(extractFacts(tree,inputText))
}
function extractFacts(tree:Tree, input:string) {
    const cursor = tree.cursor();
    const representation:SemanticRep[] = []

    if (!cursor.firstChild()) return representation; // enter Document's children
    do {
        if (cursor.type.name === "Sentence") {
            let predicate = null;
            const atoms = [];
            const aliases = [];
            
            if (cursor.firstChild()) { // enter SentenceContent + FullStop
                do {
                    if ((cursor.type.name as string) === "SentenceContent") {
                        if (!cursor.firstChild()) continue;
                        do {
                            console.log("Token type:", cursor.type.name, "Text:", input.slice(cursor.from, cursor.to));
                            const type = cursor.type.name as string;
                            const text = input.slice(cursor.from, cursor.to);
                            if (type === "Predicate") {
                                if (predicate) throw new Error("Multiple predicates in one sentence");
                                predicate = text.slice(1); // remove the '*'
                            }else if (type === "Alias") {
                                aliases.push(text.slice(1)); // remove '#'
                            }else if (type === "AtomString") {
                                console.log('string detected');
                                atoms.push(text.slice(1, -1)); // strip quotes
                            }else if (type === "AtomNumber") {
                                console.log('number detected');
                                atoms.push(text);
                            }else {//skip fillers and punctuations
                                continue;
                            }
                        } while (cursor.nextSibling());
                        cursor.parent();
                    }
                } while (cursor.nextSibling());
                cursor.parent();
            }
            if (!predicate) throw new Error("Missing predicate in sentence");
            representation.push({ predicate, atoms, aliases });
        }
    } while (cursor.nextSibling());
    return representation;
}


