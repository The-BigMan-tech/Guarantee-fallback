
import { ErrorNode, ParseTreeListener, ParserRuleContext, TerminalNode } from "antlr4ng";


import { ProgramContext } from "./DSLParser.ts";
import { FactContext } from "./DSLParser.ts";
import { AliasDeclarationContext } from "./DSLParser.ts";
import { SentenceContext } from "./DSLParser.ts";
import { TokenContext } from "./DSLParser.ts";
import { ListContext } from "./DSLParser.ts";


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
     * Enter a parse tree produced by `DSLParser.aliasDeclaration`.
     * @param ctx the parse tree
     */
    enterAliasDeclaration?: (ctx: AliasDeclarationContext) => void;
    /**
     * Exit a parse tree produced by `DSLParser.aliasDeclaration`.
     * @param ctx the parse tree
     */
    exitAliasDeclaration?: (ctx: AliasDeclarationContext) => void;
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
    /**
     * Enter a parse tree produced by `DSLParser.list`.
     * @param ctx the parse tree
     */
    enterList?: (ctx: ListContext) => void;
    /**
     * Exit a parse tree produced by `DSLParser.list`.
     * @param ctx the parse tree
     */
    exitList?: (ctx: ListContext) => void;

    visitTerminal(node: TerminalNode): void {}
    visitErrorNode(node: ErrorNode): void {}
    enterEveryRule(node: ParserRuleContext): void {}
    exitEveryRule(node: ParserRuleContext): void {}
}

