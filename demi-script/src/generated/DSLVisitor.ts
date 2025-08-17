
import { AbstractParseTreeVisitor } from "antlr4ng";


import { ProgramContext } from "./DSLParser.js";
import { FactContext } from "./DSLParser.js";
import { AliasDeclarationContext } from "./DSLParser.js";
import { SentenceContext } from "./DSLParser.js";
import { TokenContext } from "./DSLParser.js";
import { ListContext } from "./DSLParser.js";
import { AtomContext } from "./DSLParser.js";


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `DSLParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export class DSLVisitor<Result> extends AbstractParseTreeVisitor<Result> {
    /**
     * Visit a parse tree produced by `DSLParser.program`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitProgram?: (ctx: ProgramContext) => Result;
    /**
     * Visit a parse tree produced by `DSLParser.fact`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFact?: (ctx: FactContext) => Result;
    /**
     * Visit a parse tree produced by `DSLParser.aliasDeclaration`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAliasDeclaration?: (ctx: AliasDeclarationContext) => Result;
    /**
     * Visit a parse tree produced by `DSLParser.sentence`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSentence?: (ctx: SentenceContext) => Result;
    /**
     * Visit a parse tree produced by `DSLParser.token`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitToken?: (ctx: TokenContext) => Result;
    /**
     * Visit a parse tree produced by `DSLParser.list`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitList?: (ctx: ListContext) => Result;
    /**
     * Visit a parse tree produced by `DSLParser.atom`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAtom?: (ctx: AtomContext) => Result;
}

