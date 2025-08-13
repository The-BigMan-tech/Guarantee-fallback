
import { ErrorNode, ParseTreeListener, ParserRuleContext, TerminalNode } from "antlr4ng";


import { StartContext } from "./dslParser.js";
import { ExpressionContext } from "./dslParser.js";
import { MultiplyContext } from "./dslParser.js";
import { DivideContext } from "./dslParser.js";
import { AddContext } from "./dslParser.js";
import { SubtractContext } from "./dslParser.js";
import { NumberContext } from "./dslParser.js";


/**
 * This interface defines a complete listener for a parse tree produced by
 * `dslParser`.
 */
export class dslListener implements ParseTreeListener {
    /**
     * Enter a parse tree produced by `dslParser.start`.
     * @param ctx the parse tree
     */
    enterStart?: (ctx: StartContext) => void;
    /**
     * Exit a parse tree produced by `dslParser.start`.
     * @param ctx the parse tree
     */
    exitStart?: (ctx: StartContext) => void;
    /**
     * Enter a parse tree produced by `dslParser.expression`.
     * @param ctx the parse tree
     */
    enterExpression?: (ctx: ExpressionContext) => void;
    /**
     * Exit a parse tree produced by `dslParser.expression`.
     * @param ctx the parse tree
     */
    exitExpression?: (ctx: ExpressionContext) => void;
    /**
     * Enter a parse tree produced by `dslParser.multiply`.
     * @param ctx the parse tree
     */
    enterMultiply?: (ctx: MultiplyContext) => void;
    /**
     * Exit a parse tree produced by `dslParser.multiply`.
     * @param ctx the parse tree
     */
    exitMultiply?: (ctx: MultiplyContext) => void;
    /**
     * Enter a parse tree produced by `dslParser.divide`.
     * @param ctx the parse tree
     */
    enterDivide?: (ctx: DivideContext) => void;
    /**
     * Exit a parse tree produced by `dslParser.divide`.
     * @param ctx the parse tree
     */
    exitDivide?: (ctx: DivideContext) => void;
    /**
     * Enter a parse tree produced by `dslParser.add`.
     * @param ctx the parse tree
     */
    enterAdd?: (ctx: AddContext) => void;
    /**
     * Exit a parse tree produced by `dslParser.add`.
     * @param ctx the parse tree
     */
    exitAdd?: (ctx: AddContext) => void;
    /**
     * Enter a parse tree produced by `dslParser.subtract`.
     * @param ctx the parse tree
     */
    enterSubtract?: (ctx: SubtractContext) => void;
    /**
     * Exit a parse tree produced by `dslParser.subtract`.
     * @param ctx the parse tree
     */
    exitSubtract?: (ctx: SubtractContext) => void;
    /**
     * Enter a parse tree produced by `dslParser.number`.
     * @param ctx the parse tree
     */
    enterNumber?: (ctx: NumberContext) => void;
    /**
     * Exit a parse tree produced by `dslParser.number`.
     * @param ctx the parse tree
     */
    exitNumber?: (ctx: NumberContext) => void;

    visitTerminal(node: TerminalNode): void {}
    visitErrorNode(node: ErrorNode): void {}
    enterEveryRule(node: ParserRuleContext): void {}
    exitEveryRule(node: ParserRuleContext): void {}
}

