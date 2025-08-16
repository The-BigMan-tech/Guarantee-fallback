import { CharStream, CommonTokenStream } from "antlr4ng";
import { DSLParser, FactContext, ProgramContext, TokenContext} from "./generated/DSLParser.js";
import { DSLLexer } from "./generated/DSLLexer.js";
import { DSLVisitor } from "./generated/DSLVisitor.js";
import { Atoms, Rec } from "./fact-checker.js";


export function runAnalyzer():void {
    // The input DSL text to parse
    const input = `
      'ada' *friends and 'peter'.
      'cole' is *male.
    `;

    const inputStream = CharStream.fromString(input);
    const lexer = new DSLLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new DSLParser(tokenStream);
    const tree = parser.program();

    // Helper to remove fillers, extract atoms and predicates from tokens in a fact
    function extractFactData(tokens:TokenContext[]):{predicate: string;atoms:Atoms} {
        const atoms: string[] = [];
        let predicate = "";
        
        tokens.forEach((token) => {
            const text = token.getText();
            const type = token.;
            
            if (type === DSLLexer.PREDICATE) {
                predicate = text.slice(1); // Remove the leading '*'
            }else if (type === DSLLexer.ATOM) {
                atoms.push(stripQuotes(text));
            } else if (type === DSLLexer.ALIAS) {
                //
            }
        });
        return { predicate, atoms };
    }
    function stripQuotes(str: string): string {
        if (str.startsWith("'") && str.endsWith("'")) {
            return str.slice(1, -1);
        }
        return str;
    }

    class MyDSLVisitor extends DSLVisitor<void> {
        /* eslint-disable @typescript-eslint/explicit-function-return-type */
        public records:Record<string,Rec> = {};

        public visitProgram = (ctx:ProgramContext)=> {
            ctx.fact().forEach(factCtx => this.visitFact(factCtx));// Visit each fact (sentence) under program
            return this.records;
        };
        public visitFact = (ctx:FactContext)=> {
            // Collect tokens in this fact
            const tokens = ctx.sentence().token();
            const { predicate, atoms } = extractFactData(tokens);

            if (!predicate || atoms.length === 0) {
                throw new Error("Each fact must have exactly one predicate and at least one atom.");
            }
            if (!this.records[predicate]) {
                this.records[predicate] = new Rec([]);
            }
            this.records[predicate].add(atoms);
            atoms.forEach(atom => this.records[predicate].members.add(atom));
        };
    }
    const visitor = new MyDSLVisitor();
    const resultRecords = visitor.visit(tree);
    console.log(resultRecords);
}