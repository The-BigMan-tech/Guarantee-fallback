import { CharStream, CommonTokenStream, ConsoleErrorListener,Token } from "antlr4ng";
import { AliasDeclarationContext,DSLParser, FactContext,ProgramContext } from "./generated/DSLParser.js";
import { DSLLexer } from "./generated/DSLLexer.js";
import { DSLVisitor } from "./generated/DSLVisitor.js";
import { Rec } from "./fact-checker.js";
import chalk from "chalk";
import Denque from "denque";
import { cartesianProduct } from "combinatorial-generators";
// import stringify from "safe-stable-stringify";
// import {colorize} from "json-colorizer";


//todo:Make the fuctions more typesafe by replacing all the type shortcuts i made with the any type to concrete ones.and also try to make the predicates typed instead of dynamically sized arrays of either string or number.This has to be done in the dsl if possible.
interface BracketCount {
    left: number;
    right: number;
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
    private tokensCount:number = 0;

    private printTokens(tokens:Token[]):void {
        const tokenDebug = tokens.map(t => ({ text: t.text,name:DSLLexer.symbolicNames[t.type]}));
        console.log('\n Tokens:',tokenDebug);
    }
    public visitProgram = (ctx:ProgramContext)=> {
        for (const child of ctx.children) {
            if (child instanceof FactContext) {
                this.visitFact(child);
            } else if (child instanceof AliasDeclarationContext) {
                this.visitAliasDeclaration(child);
            }
            this.tokensCount += 1;
        }
        return this.records;
    };
    public visitFact = (ctx:FactContext)=> {
        const tokens = Essentials.tokenStream.getTokens(ctx.start?.tokenIndex, ctx.stop?.tokenIndex);
        this.printTokens(tokens);
        this.buildFact(tokens);
    };
    public visitAliasDeclaration = (ctx:AliasDeclarationContext)=> {
        const tokens = Essentials.tokenStream.getTokens(ctx.start?.tokenIndex, ctx.stop?.tokenIndex);
        this.printTokens(tokens);
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
    private stripMark(text:string) {
        return text.slice(1);// Remove the leading '*' or '#'
    }
    private flattenRecursively(input:any[][],flatSequences:any[][] = []):any[][] {
        for (const product of cartesianProduct(...input)) {
            if (product.some(value=>value instanceof Array)) {
                const boxedProduct = product.map(value=>{
                    if (!(value instanceof Array)) return [value];
                    return value;
                });
                this.flattenRecursively(boxedProduct,flatSequences);
            }else {
                flatSequences.push(product);
            }
        } 
        return flatSequences;
    }
    private validatePredicateType(token:Token) {
        const isAlias = this.aliases.has(this.stripMark(token.text!));//the aliases set stores plain words
        if (isAlias && ! token.text!.startsWith('#')) {
            throw new Error(`Aliases are meant to be prefixed with '#' but you typed: ${token.text}`);
        }
        if (!isAlias && ! token.text!.startsWith("*")) {
            throw new Error(`Predicates are meant to be prefixed with '*' but you typed: ${token.text}`);
        }
    }
    private getPredicate(tokens:Token[]):string {
        let predicate:string | null = null;
        tokens.forEach(token => {
            const text = token.text!;
            const type = token.type;
            if ((type === DSLLexer.PREDICATE) || (type === DSLLexer.ALIAS) ) {
                if (predicate !== null) {
                    throw new Error('You can only have one predicate or alias in a sentence');
                }
                this.validatePredicateType(token);
                predicate = this.stripMark(text);
            }
        });
        if (predicate === null) {
            throw new Error("You must include one predicate or alias in the sentence");
        }
        return predicate;
    }
    private buildFact(tokens:Token[]) {
        const predicate = this.getPredicate(tokens);
        const tokenQueue = new Denque(tokens);
        const groupedData = this.getMembersInBoxes(tokenQueue);
        const flattenedData = this.flattenRecursively(groupedData.list);
        const bracketCount = groupedData.bracketCount;

        if (bracketCount.left !== bracketCount.right) {
            throw new Error(`${chalk.red(`An array at line ${this.tokensCount} isnt enclosed properly: `)}`);
        }
        for (const atoms of flattenedData) {
            console.log('🚀 => :116 => buildFact => flatData:', atoms);
            if (atoms.length === 0) {
                throw new Error("Each fact must have at least one atom in a sentence.");
            }
            if (!this.records[predicate]) {
                this.records[predicate] = new Rec([]);
            }
            this.records[predicate].add(atoms);
        }
    }
    private getMembersInBoxes(tokens:Denque<Token>,inRoot:boolean=true,bracketCount:BracketCount={left:0,right:0}) {
        const list:any[] = [];

        while (tokens.length !== 0) {
            const token = tokens.shift()!;
            const type = token.type;
            const text = token.text!;
            if (type === DSLLexer.NAME) {
                const str = this.stripMark(text);
                list.push((inRoot)?[str]:str);
            }
            else if (type === DSLLexer.NUMBER) {
                const num = Number(text);
                list.push((inRoot)?[num]:num);
            }
            else if (type === DSLLexer.LSQUARE) {
                inRoot = false;
                bracketCount.left += 1;
                list.push(this.getMembersInBoxes(tokens,inRoot,bracketCount).list);
            }
            else if (type === DSLLexer.RSQUARE) {
                bracketCount.right += 1;
                break;
            }
        };
        return {list,bracketCount};
    }
}
function validateInput(input:string) {
    const inputArr = input.split('\n');
    console.log('input arr: ',inputArr);
    inputArr.forEach((str,index)=>{
        str = str.trim();
        if ((str.length > 0) && (!str.endsWith('.'))) {
            throw new Error(`${chalk.red(`line ${index} must be terminated: `)} ${str}`);
        }
    });
}
export function genStruct(input:string):Record<string,Rec> {
    validateInput(input);
    Essentials.loadEssentials(input);
    const visitor = new CustomVisitor();
    visitor.visit(Essentials.tree);
    // console.log('Results: ',colorize(stringify(visitor.records,null,2)));
    return visitor.records;
}
