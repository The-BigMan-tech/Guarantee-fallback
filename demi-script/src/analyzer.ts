import { CharStream, CommonTokenStream } from "antlr4ng";
import { DSLLexer } from "./generated/dslLexer.js";
import { dslParser } from "./generated/dslParser.js";


// The input DSL text to parse
const input = `
  'ada' *friends and 'peter'.
  'cole' is *male.
`;

// Create a character stream from the input string
const inputStream = CharStream.fromString(input);

// Create a lexer instance with the input stream
const lexer = new DSLLexer(inputStream);

// Create a token stream from the lexer
const tokenStream = new CommonTokenStream(lexer);

// Create a parser instance with the token stream
const parser = new dslParser(tokenStream);

// Parse starting from the top-level rule (program or fact depending on your grammar)
const tree = parser.();


class MyDSLVisitor extends DSLVisitor<void> {
    visitFact(ctx) {
        return super.visitFact(ctx);
    }
}

// Instantiate and run the visitor
const visitor = new MyDSLVisitor();
visitor.visit(tree);
