import { CharStream, CommonTokenStream, Token } from "antlr4ng";
import { DSLParser, FactContext, ProgramContext } from "./generated/DSLParser.js";
import { DSLLexer } from "./generated/DSLLexer.js";
import { DSLVisitor } from "./generated/DSLVisitor.js";
import { Atoms, Rec } from "./fact-checker.js";
import { colorize } from 'json-colorizer';
import stringify from "safe-stable-stringify";

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
class StructBuilder {
    public static buildFactData(tokens:Token[]):{predicate: string;atoms:Atoms} {
        const atoms: string[] = [];
        let predicate = "";
        
        tokens.forEach((token) => {
            const text = token.text!;
            const type = token.type;
            
            if (type === DSLLexer.PREDICATE) {
                predicate = text.slice(1); // Remove the leading '*'
            }else if (type === DSLLexer.ATOM) {
                atoms.push(StructBuilder.stripQuotes(text));
            } else if (type === DSLLexer.ALIAS) {
                //
            }
        });
        return { predicate, atoms };
    }
    private static stripQuotes(value:string):string  {
        if (value.startsWith("'") || value.endsWith("'") || value.startsWith('"') || value.startsWith('"')) {
            return value.slice(1, -1);
        }
        return value;
    }
}

class CustomVisitor extends DSLVisitor<void> {
    /* eslint-disable @typescript-eslint/explicit-function-return-type */
    public records:Record<string,Rec> = {};

    public visitProgram = (ctx:ProgramContext)=> {
        ctx.fact().forEach(factCtx => this.visitFact(factCtx));// Visit each fact (sentence) under program
        return this.records;
    };
    public visitFact = (ctx:FactContext)=> {
        // Collect tokens in this fact
        const tokens = Essentials.tokenStream.getTokens(ctx.start?.tokenIndex, ctx.stop?.tokenIndex);
        const tokenDebug = tokens.map(t => ({ text: t.text,name:DSLLexer.symbolicNames[t.type]}));
        console.log('Tokens for fact:',tokenDebug);
        const { predicate, atoms } = StructBuilder.buildFactData(tokens);

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