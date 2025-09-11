import { ConsoleErrorListener } from "antlr4ng";
import { DSLLexer } from "../generated/DSLLexer.js";
import { DSLParser } from "../generated/DSLParser.js";
import { CharStream } from "antlr4ng";
import { ProgramContext } from "../generated/DSLParser.js";
import { CommonTokenStream } from "antlr4ng";
import { EndOfLine } from "../utils/utils.js";

export class ParseHelper {
    //these properties have to be long lived(static) for it to work.else,it will cause bugs
    public static inputStream:CharStream;
    public static lexer:DSLLexer;
    public static tokenStream:CommonTokenStream;
    public static parser:DSLParser;
    public static tree:ProgramContext | null;

    public static parse(input:string):void {
        ConsoleErrorListener.instance.syntaxError = (recognizer:any, offendingSymbol:any, line: number, column:number, msg: string): void =>{
            const zeroBasedLine = line - 1;//the line returned by this listenere is 1-based so i deducted 1 to make it 0-based which is the correct form the pogram understands
            const srcLine = Resolver.srcLine(zeroBasedLine);
            const srcText = ((srcLine)?srcLine[column]:undefined) || EndOfLine.value;

            console.log('src txt',srcText);
            ParseHelper.castReport({
                kind:ReportKind.Syntax,
                line:zeroBasedLine,
                srcText,
                msg,
            });
        };
        ParseHelper.inputStream = CharStream.fromString(input);
        ParseHelper.lexer = new DSLLexer(ParseHelper.inputStream);
        ParseHelper.tokenStream = new CommonTokenStream(ParseHelper.lexer);
        ParseHelper.parser = new DSLParser(ParseHelper.tokenStream);
        ParseHelper.tree = ParseHelper.parser.program();
    }
}