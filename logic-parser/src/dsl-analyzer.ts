import { Atoms } from "./fact-checker.ts";
import { parser } from "./parser.js";  // your generated parser
import { Tree } from "@lezer/common";

export function runAnalyzer() {
    const inputText = `
        'ada' and 'peter' are *friends.
        'peter','jane' and 'billy' are *friends.
    `;  // example input
    const tree:Tree = parser.parse(inputText);
    console.log('🚀 => :5 => tree:', tree);
    extractFacts(tree,inputText)
}
interface SemanticRep {
    predicate:string,
    atoms:Atoms,
    aliases:string[]
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
                    if (cursor.firstChild() && (cursor.type.name === "SentenceContent")) {
                        do {
                            const type = cursor.type.name;
                            const text = input.slice(cursor.from, cursor.to);
                            if (type === "Predicate") {
                                if (predicate) throw new Error("Multiple predicates in one sentence");
                                predicate = text.slice(1); // remove the '*'
                            }else if (type === "Alias") {
                                aliases.push(text.slice(1)); // remove '#'
                            }else if (type === "AtomString") {
                                atoms.push(text.slice(1, -1)); // strip quotes
                            }else if (type === "AtomNumber") {
                                atoms.push(text);
                            } else if (type === "Filler") {
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



