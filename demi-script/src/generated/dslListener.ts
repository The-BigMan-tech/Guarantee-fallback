
import { ErrorNode, ParseTreeListener, ParserRuleContext, TerminalNode } from "antlr4ng";


import { ProgramContext } from "./DSLParser.js";
import { FactContext } from "./DSLParser.js";
import { SentenceContext } from "./DSLParser.js";
import { TokenContext } from "./DSLParser.js";


/**
 * This interface defines a complete listener for a parse tree produced by
 * `DSLParser`.
 */
export class DSLListener implements ParseTreeListener {
    /**
     * Enter a parse tree produced by `DSLParser.program`.
     * @param ctx the parse tree
     */
    enterProgram?: (ctx: ProgramContext) => void;
    /**
     * Exit a parse tree produced by `DSLParser.program`.
     * @param ctx the parse tree
     */
    exitProgram?: (ctx: ProgramContext) => void;
    /**
     * Enter a parse tree produced by `DSLParser.fact`.
     * @param ctx the parse tree
     */
    enterFact?: (ctx: FactContext) => void;
    /**
     * Exit a parse tree produced by `DSLParser.fact`.
     * @param ctx the parse tree
     */
    exitFact?: (ctx: FactContext) => void;
    /**
     * Enter a parse tree produced by `DSLParser.sentence`.
     * @param ctx the parse tree
     */
    enterSentence?: (ctx: SentenceContext) => void;
    /**
     * Exit a parse tree produced by `DSLParser.sentence`.
     * @param ctx the parse tree
     */
    exitSentence?: (ctx: SentenceContext) => void;
    /**
     * Enter a parse tree produced by `DSLParser.token`.
     * @param ctx the parse tree
     */
    enterToken?: (ctx: TokenContext) => void;
    /**
     * Exit a parse tree produced by `DSLParser.token`.
     * @param ctx the parse tree
     */
    exitToken?: (ctx: TokenContext) => void;

    visitTerminal(node: TerminalNode): void {}
    visitErrorNode(node: ErrorNode): void {}
    enterEveryRule(node: ParserRuleContext): void {}
    exitEveryRule(node: ParserRuleContext): void {}
}

