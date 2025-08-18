import { CharStream, CommonTokenStream, Token } from "antlr4ng";
import { AliasDeclarationContext,DSLParser, FactContext, ProgramContext } from "./generated/DSLParser.js";
import { DSLLexer } from "./generated/DSLLexer.js";
import { DSLVisitor } from "./generated/DSLVisitor.js";
import { Atoms, Rec } from "./fact-checker.js";

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

    public printTokens(tokens:Token[]):void {
        const tokenDebug = tokens.map(t => ({ text: t.text,name:DSLLexer.symbolicNames[t.type]}));
        console.log('Tokens:',tokenDebug);
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
        this.printTokens(tokens);
        let alias = '';
        let predicateRec:Rec = new Rec([]);
        tokens.forEach(token=>{
            const text = token.text!;
            const type = token.type;

            if (type === DSLLexer.ALIAS) {
                alias = text;
            }else if (type === DSLLexer.PREDICATE) {
                predicateRec = this.records[text.slice(1)];
            }
        });
        this.records[alias] = predicateRec;
    };
    public buildFact(tokens:Token[]):{predicate: string;atoms:Atoms} {
        const atoms: string[] = [];
        let predicate = "";
        tokens.forEach(token => {
            const text = token.text!;
            const type = token.type;

            if ((type === DSLLexer.PREDICATE) || (type === DSLLexer.ALIAS)) {
                predicate = text.slice(1); // Remove the leading '*' or '#'
            }else if (type === DSLLexer.ATOM) {
                atoms.push(text.startsWith(":")?text.slice(1):text);//to strip the colon
            }
        });
        return { predicate, atoms };
    }
    public visitFact = (ctx:FactContext)=> {
        const tokens = Essentials.tokenStream.getTokens(ctx.start?.tokenIndex, ctx.stop?.tokenIndex);
        const { predicate, atoms } = this.buildFact(tokens);
        this.printTokens(tokens);

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
    return visitor.records;
}