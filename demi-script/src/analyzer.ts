import { CharStream, CommonTokenStream, Token } from "antlr4ng";
import { AliasDeclarationContext,DSLParser, FactContext, ListContext, ProgramContext } from "./generated/DSLParser.js";
import { DSLLexer } from "./generated/DSLLexer.js";
import { DSLVisitor } from "./generated/DSLVisitor.js";
import { Atom, Atoms, Rec } from "./fact-checker.js";
import {colorize} from "json-colorizer";
import stringify from "safe-stable-stringify";
import Denque from "denque";
import { cartesianProduct } from "combinatorial-generators";

function printTokens(tokens:Token[]):void {
    const tokenDebug = tokens.map(t => ({ text: t.text,name:DSLLexer.symbolicNames[t.type]}));
    console.log('Tokens:',tokenDebug);
}
class Essentials {
    public static inputStream:CharStream;
    public static lexer:DSLLexer;
    public static tokenStream:CommonTokenStream;
    public static parser:DSLParser;
    public static tree:ProgramContext;

    public static loadEssentials(input:string):void {
        Essentials.inputStream = CharStream.fromString(input);
        Essentials.lexer = new DSLLexer(Essentials.inputStream);
        Essentials.tokenStream = new CommonTokenStream(Essentials.lexer);
        Essentials.parser = new DSLParser(Essentials.tokenStream);
        Essentials.tree = Essentials.parser.program();
    }
}
class CustomVisitor extends DSLVisitor<void> {
    /* eslint-disable @typescript-eslint/explicit-function-return-type */
    public records:Record<string,Rec> = {};
    private aliases = new Set<string>();

    private stripMark(text:string) {
        return text.slice(1);// Remove the leading '*' or '#'
    }
    private flattenRecursively(input:any[][],flatSequences:any[][] = []):any[][] {
        for (const product of cartesianProduct(...input)) {
            if (product.some(value=>value instanceof Array)) {
                const boxedProduct = product.map(value=>{
                    if (!(value instanceof Array)) {
                        return [value];
                    }
                    return value;
                });
                this.flattenRecursively(boxedProduct,flatSequences);
            }else {
                flatSequences.push(product);
            }
        } 
        return flatSequences;
    }
    public visitProgram = (ctx:ProgramContext)=> {
        for (const child of ctx.children) {
            if (child instanceof FactContext) {
                this.visitFact(child);
            } else if (child instanceof AliasDeclarationContext) {
                this.visitAliasDeclaration(child);
            }
        }
        return this.records;
    };
    public visitAliasDeclaration = (ctx:AliasDeclarationContext)=> {
        const tokens = Essentials.tokenStream.getTokens(ctx.start?.tokenIndex, ctx.stop?.tokenIndex);
        printTokens(tokens);
        let alias = '';
        let predicateRec:Rec = new Rec([]);
        tokens.forEach(token=>{
            const text = token.text!;
            const type = token.type;

            if (type === DSLLexer.PLAIN_WORD) {
                alias = text;
            }else if (type === DSLLexer.PREDICATE) {
                const predicate = this.stripMark(text);
                if (!this.records[predicate]) {
                    this.records[predicate] = new Rec([]);
                }
                predicateRec = this.records[predicate];
            }
        });
        this.records[alias] = predicateRec;
        this.aliases.add(alias);
    };
    private validatePredicateType(token:Token) {
        const isAlias = this.aliases.has(this.stripMark(token.text!));//the aliases set stores plain words
        if (isAlias && ! token.text!.startsWith('#')) {
            throw new Error(`Aliases are meant to be prefixed with '#' but you typed: ${token.text}`);
        }
        if (!isAlias && ! token.text!.startsWith("*")) {
            throw new Error(`Predicates are meant to be prefixed with '*' but you typed: ${token.text}`);
        }
    }
    private buildFact(tokens:Token[]):{predicate: string;atoms:Atoms} {
        const atoms: string[] = [];
        let predicate:string = "";
        tokens.forEach(token => {
            const text = token.text!;
            const type = token.type;
            if ((type === DSLLexer.PREDICATE) || (type === DSLLexer.ALIAS)) {
                this.validatePredicateType(token);
                predicate = this.stripMark(text);
            }
            // else if (type === DSLLexer.ATOM) {
            //     atoms.push(text.startsWith(":")?this.stripMark(text):text);//to strip the colon
            // }
        });
        const groupingData = this.extractLists(new Denque(tokens));
        const flattenedData = this.flattenRecursively(groupingData);
        console.log('flattened array: ',stringify(flattenedData));
        return { predicate, atoms };
    }
    private extractLists(tokens:Denque<Token>) {
        const parts:Atoms[] = [];
        const list = [];
        let inList:boolean = false;

        while (tokens.length !== 0) {
            const token = tokens.shift()!;
            const type = token.type;
            const text = token.text!;
            if (inList) {
                if (type === DSLLexer.ATOM) {
                    list.push(text);
                }
                else if (type === DSLLexer.LSQUARE) {
                    tokens.unshift(token);//to add back the lsquare so that it can enter into the list
                    list.push(this.extractLists(tokens))
                }
                else if (type === DSLLexer.RSQUARE) {
                    parts.push(structuredClone(list));
                    break;
                }
            }
            else if (type === DSLLexer.LSQUARE) {
                inList = true;
            }
            else if (type === DSLLexer.ATOM) {
                parts.push([text])
            }
        };
        return parts;
    }
    public visitFact = (ctx:FactContext)=> {
        const tokens = Essentials.tokenStream.getTokens(ctx.start?.tokenIndex, ctx.stop?.tokenIndex);
        const { predicate, atoms } = this.buildFact(tokens);
        printTokens(tokens);

        if (!predicate || atoms.length === 0) {
            throw new Error("Each fact must have exactly one predicate and at least one atom.");
        }
        if (!this.records[predicate]) {
            this.records[predicate] = new Rec([]);
        }
        this.records[predicate].add(atoms);
    };
}
export function genStruct(input:string):Record<string,Rec> {
    Essentials.loadEssentials(input);
    const visitor = new CustomVisitor();
    visitor.visit(Essentials.tree);
    console.log('Results: ',colorize(stringify(visitor.records,null,2)));
    return visitor.records;
}
