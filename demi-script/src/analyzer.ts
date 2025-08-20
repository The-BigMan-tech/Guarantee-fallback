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
class Essentials {
    public static inputStream:CharStream;
    public static lexer:DSLLexer;
    public static tokenStream:CommonTokenStream;
    public static parser:DSLParser;
    public static tree:ProgramContext;

    public static terminateWithError(errorType:string,lineCount:number,msg:string,checkLines?:number[]):void {
        function pushLine(line:number):void {
            messages.push(chalk.green(Analyzer.inputArr[line-1].trim() + '\n'));
        }
        const messages = [
            chalk.red.underline(`\n${errorType} Error at line ${lineCount}:`),
            chalk.white(`\n${msg}`),
        ];
        if (!checkLines) {
            messages.push(chalk.yellow('\nPlease Check ->'));
            pushLine(lineCount);
        }else {
            messages.push(chalk.yellow.underline('\n\nCheck these lines:\n'));
            for (const line of checkLines) {
                messages.push(chalk.gray(`${line}.`));
                pushLine(line);
            }
        }
        console.error(...messages);
        Analyzer.terminate = true;
    }
    public static loadEssentials(input:string):void {
        ConsoleErrorListener.instance.syntaxError = (recognizer:any, offendingSymbol:any, line: number, column:any, msg: string): void =>{
            Essentials.terminateWithError('Syntax',line,msg);
        };
        Essentials.inputStream = CharStream.fromString(input);
        Essentials.lexer = new DSLLexer(Essentials.inputStream);
        Essentials.tokenStream = new CommonTokenStream(Essentials.lexer);
        Essentials.parser = new DSLParser(Essentials.tokenStream);
        Essentials.tree = Essentials.parser.program();
    }
}
interface ResolvedTokenRef {
    index:number | null,
    token:Token | null
}
interface ResolvedTokensRef {
    index:number | null,
    tokens:Token[] | null
}
class Analyzer extends DSLVisitor<void> {
    /* eslint-disable @typescript-eslint/explicit-function-return-type */
    public  records:Record<string,Rec> = {};
    private aliases = new Set<string>();
    private lineCount:number = 1;

    private lastTokensForSingle:Token[] | null = null;
    private lastTokensForGroup:Token[] | null = null;

    public static terminate:boolean = false;

    private printTokens(tokens:Token[]):void {
        const tokenDebug = tokens.map(t => ({ text: t.text,name:DSLLexer.symbolicNames[t.type]}));
        console.log('\n Tokens:',tokenDebug);
    }
    public visitProgram = (ctx:ProgramContext)=> {
        for (const child of ctx.children) {
            if (Analyzer.terminate) return;
            if (child instanceof FactContext) {
                this.visitFact(child);
            }else if (child instanceof AliasDeclarationContext) {
                this.visitAliasDeclaration(child);
            }
            this.lineCount += 1;
        }
        return this.records;
    };
    public visitFact = (ctx:FactContext)=> {
        const tokens = Essentials.tokenStream.getTokens(ctx.start?.tokenIndex, ctx.stop?.tokenIndex);
        this.resolveRefs(tokens);
        this.printTokens(tokens);
        if (!Analyzer.terminate) this.buildFact(tokens);//i checked for termination here because ref resolution can fail
    };
    public visitAliasDeclaration = (ctx:AliasDeclarationContext)=> {
        const tokens = Essentials.tokenStream.getTokens(ctx.start?.tokenIndex, ctx.stop?.tokenIndex);
        this.printTokens(tokens);
        this.resolveAlias(tokens);
    };

    private getListTokensBlock(tokens:Denque<Token>) {
        const list:Token[] = [];
        let lBrackets:number = 0;
        let rBrackets:number = 0;

        while (tokens.length !== 0) {
            const token = tokens.shift()!;
            const type = token.type;
            if (type === DSLLexer.LSQUARE) {
                list.push(token);
                lBrackets += 1;
            }
            else if (type === DSLLexer.RSQUARE) {
                list.push(token);
                rBrackets += 1;
            }else {
                if (lBrackets !== rBrackets) {
                    console.log('l:',lBrackets,'r:',rBrackets);
                    list.push(token);
                }else {
                    break;
                }
            }
        };
        return list;
    }
    private resolveRefs(tokens: Token[]) {
        const resolvedTokenRef:ResolvedTokenRef = {index:null,token:null};
        const resolvedTokensRef:ResolvedTokensRef = {index:null,tokens:null};

        for (const [index,token] of tokens.entries()){
            const type = token.type;
            if (type === DSLLexer.SINGLE_REF) {
                resolvedTokenRef.index = index;
                resolvedTokenRef.token = this.lastTokensForSingle?.find(token=>token.type===DSLLexer.NAME) || null;
                break;
            }
            else if (type === DSLLexer.GROUP_REF) {
                resolvedTokensRef.index = index;
                if (this.lastTokensForGroup) {
                    resolvedTokensRef.tokens = this.getListTokensBlock(new Denque(this.lastTokensForGroup));
                    console.log('last array tokens:');
                    this.printTokens(resolvedTokensRef.tokens);
                }
                break;
            }
            else if (type === DSLLexer.NAME) {
                this.lastTokensForSingle = tokens;
                break;
            }
            else if (type === DSLLexer.LSQUARE) {
                this.lastTokensForGroup = tokens;
                break;
            }
        };

        if (resolvedTokenRef.index !== null) {
            if (resolvedTokenRef.token !== null) {//resolve the single ref
                tokens[resolvedTokenRef.index] = resolvedTokenRef.token;
            }else {
                Essentials.terminateWithError('Semantic',this.lineCount,`Failed to resolve the singular reference,${tokens[resolvedTokenRef.index].text}.Could not find a name to point it to.`,[this.lineCount-1,this.lineCount]);
            }
        }
        if (resolvedTokensRef.index !== null) {
            if (resolvedTokensRef.tokens !== null) {//resolve the group ref
                tokens.splice(resolvedTokensRef.index!,1,...resolvedTokensRef.tokens);
            }else {
                Essentials.terminateWithError('Semantic',this.lineCount,`Failed to resolve the group reference,${tokens[resolvedTokensRef.index].text}.Could not find an array to point it to.`);
            }
        }
    }
    private stripMark(text:string) {
        return text.slice(1);// Remove the leading '*' or '#'
    }
    private resolveAlias(tokens:Token[]) {
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
    private validatePredicateType(token:Token):void {
        const isAlias = this.aliases.has(this.stripMark(token.text!));//the aliases set stores plain words
        if (isAlias && ! token.text!.startsWith('#')) {
            Essentials.terminateWithError('Semantic',this.lineCount,`Aliases are meant to be prefixed with '#' but found: ${token.text}.`);
        }
        if (!isAlias && ! token.text!.startsWith("*")) {
            Essentials.terminateWithError('Semantic',this.lineCount,`Predicates are meant to be prefixed with '*' but found: ${token.text}.Did you forget to declare it as an alias?`);
        }
    }
    private getPredicate(tokens:Token[]):string | null {
        let predicate:string | null = null;
        tokens.forEach(token => {
            const text = token.text!;
            const type = token.type;
            if ((type === DSLLexer.PREDICATE) || (type === DSLLexer.ALIAS) ) {
                if (predicate !== null) {
                    Essentials.terminateWithError('Semantic',this.lineCount,`A sentence can only have one alias or predicate in a sentence but found *${predicate} and ${text} used at the same time.`);
                }
                this.validatePredicateType(token);
                predicate = this.stripMark(text);
            }
        });
        if (predicate === null) {
            Essentials.terminateWithError('Semantic',this.lineCount,'A sentence must have at least one atom or predicate.');
        }
        return predicate;
    }
    private buildFact(tokens:Token[]) {
        const predicate = this.getPredicate(tokens);
        if (predicate === null) return;
        const tokenQueue = new Denque(tokens);
        const groupedData = this.getMembersInBoxes(tokenQueue);
        console.log('🚀 => :176 => buildFact => groupedData:', groupedData);
        const flattenedData = this.flattenRecursively(groupedData);
        for (const atoms of flattenedData) {
            console.log('🚀 => :116 => buildFact => flatData:', atoms);
            if (atoms.length === 0) {
                Essentials.terminateWithError('Semantic',this.lineCount,'A sentence must contain at least one atom.');
            }
            if (!this.records[predicate]) {
                this.records[predicate] = new Rec([]);
            }
            this.records[predicate].add(atoms);
        }
    }
    private getMembersInBoxes(tokens:Denque<Token>,level:[number]=[0]) {
        const list:any[] = [];
        const inRoot = level[0] === 0;
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
                level[0] += 1;
                list.push(this.getMembersInBoxes(tokens,level));
            }
            else if (type === DSLLexer.RSQUARE) {
                level[0] -= 1;
                break;
            }
        };
        return list;
    }
    public static inputArr:string[] = [];
    public createSentenceArray(input:string) {
        Analyzer.inputArr = input.split('\n');
    }
}
export function genStruct(input:string):Record<string,Rec> | undefined {
    const visitor = new Analyzer();
    visitor.createSentenceArray(input);
    Essentials.loadEssentials(input);
    visitor.visit(Essentials.tree);
    if (!Analyzer.terminate) return visitor.records;
}
