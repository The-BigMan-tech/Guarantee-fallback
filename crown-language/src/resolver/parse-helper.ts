import { DSLLexer } from "../generated/DSLLexer.js";
import { DSLParser } from "../generated/DSLParser.js";
import { CharStream } from "antlr4ng";
import { ProgramContext } from "../generated/DSLParser.js";
import { CommonTokenStream } from "antlr4ng";

export class ParseHelper {
    //these properties have to be long lived(static) for it to work.else,it will cause bugs
    public static inputStream:CharStream;
    public static lexer:DSLLexer;
    public static tokenStream:CommonTokenStream;
    public static parser:DSLParser;
    public static tree:ProgramContext | null;

    public static parse(input:string):void {
        ParseHelper.inputStream = CharStream.fromString(input);
        ParseHelper.lexer = new DSLLexer(ParseHelper.inputStream);
        ParseHelper.tokenStream = new CommonTokenStream(ParseHelper.lexer);
        ParseHelper.parser = new DSLParser(ParseHelper.tokenStream);
        ParseHelper.tree = ParseHelper.parser.program();
    }
}