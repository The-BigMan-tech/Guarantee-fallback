
import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { dslListener } from "./dslListener.js";
// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
 
type int = number;


export class dslParser extends antlr.Parser {
    public static readonly T__0 = 1;
    public static readonly T__1 = 2;
    public static readonly T__2 = 3;
    public static readonly T__3 = 4;
    public static readonly T__4 = 5;
    public static readonly T__5 = 6;
    public static readonly NUMBER = 7;
    public static readonly WS = 8;
    public static readonly RULE_start = 0;
    public static readonly RULE_expression = 1;
    public static readonly RULE_multiply = 2;
    public static readonly RULE_divide = 3;
    public static readonly RULE_add = 4;
    public static readonly RULE_subtract = 5;
    public static readonly RULE_number = 6;

    public static readonly literalNames = [
        null, "'('", "')'", "'*'", "'/'", "'+'", "'-'"
    ];

    public static readonly symbolicNames = [
        null, null, null, null, null, null, null, "NUMBER", "WS"
    ];
    public static readonly ruleNames = [
        "start", "expression", "multiply", "divide", "add", "subtract", 
        "number",
    ];

    public get grammarFileName(): string { return "dsl.g4"; }
    public get literalNames(): (string | null)[] { return dslParser.literalNames; }
    public get symbolicNames(): (string | null)[] { return dslParser.symbolicNames; }
    public get ruleNames(): string[] { return dslParser.ruleNames; }
    public get serializedATN(): number[] { return dslParser._serializedATN; }

    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException {
        return new antlr.FailedPredicateException(this, predicate, message);
    }

    public constructor(input: antlr.TokenStream) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, dslParser._ATN, dslParser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    public start(): StartContext {
        const localContext = new StartContext(this.context, this.state);
        this.enterRule(localContext, 0, dslParser.RULE_start);
        try {
            this.state = 18;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 0, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                    this.state = 14;
                    this.multiply();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                    this.state = 15;
                    this.divide();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                    this.state = 16;
                    this.add();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                    this.state = 17;
                    this.subtract();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public expression(): ExpressionContext {
        const localContext = new ExpressionContext(this.context, this.state);
        this.enterRule(localContext, 2, dslParser.RULE_expression);
        try {
            this.state = 25;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case dslParser.T__0:
                this.enterOuterAlt(localContext, 1);
                {
                    this.state = 20;
                    this.match(dslParser.T__0);
                    this.state = 21;
                    this.expression();
                    this.state = 22;
                    this.match(dslParser.T__1);
                }
                break;
            case dslParser.NUMBER:
                this.enterOuterAlt(localContext, 2);
                {
                    this.state = 24;
                    this.number_();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public multiply(): MultiplyContext {
        const localContext = new MultiplyContext(this.context, this.state);
        this.enterRule(localContext, 4, dslParser.RULE_multiply);
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 27;
                this.expression();
                this.state = 28;
                this.match(dslParser.T__2);
                this.state = 29;
                this.expression();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public divide(): DivideContext {
        const localContext = new DivideContext(this.context, this.state);
        this.enterRule(localContext, 6, dslParser.RULE_divide);
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 31;
                this.expression();
                this.state = 32;
                this.match(dslParser.T__3);
                this.state = 33;
                this.expression();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public add(): AddContext {
        const localContext = new AddContext(this.context, this.state);
        this.enterRule(localContext, 8, dslParser.RULE_add);
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 35;
                this.expression();
                this.state = 36;
                this.match(dslParser.T__4);
                this.state = 37;
                this.expression();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public subtract(): SubtractContext {
        const localContext = new SubtractContext(this.context, this.state);
        this.enterRule(localContext, 10, dslParser.RULE_subtract);
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 39;
                this.expression();
                this.state = 40;
                this.match(dslParser.T__5);
                this.state = 41;
                this.expression();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public number_(): NumberContext {
        const localContext = new NumberContext(this.context, this.state);
        this.enterRule(localContext, 12, dslParser.RULE_number);
        try {
            this.enterOuterAlt(localContext, 1);
            {
                this.state = 43;
                this.match(dslParser.NUMBER);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }

    public static readonly _serializedATN: number[] = [
        4,1,8,46,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,6,
        1,0,1,0,1,0,1,0,3,0,19,8,0,1,1,1,1,1,1,1,1,1,1,3,1,26,8,1,1,2,1,
        2,1,2,1,2,1,3,1,3,1,3,1,3,1,4,1,4,1,4,1,4,1,5,1,5,1,5,1,5,1,6,1,
        6,1,6,0,0,7,0,2,4,6,8,10,12,0,0,42,0,18,1,0,0,0,2,25,1,0,0,0,4,27,
        1,0,0,0,6,31,1,0,0,0,8,35,1,0,0,0,10,39,1,0,0,0,12,43,1,0,0,0,14,
        19,3,4,2,0,15,19,3,6,3,0,16,19,3,8,4,0,17,19,3,10,5,0,18,14,1,0,
        0,0,18,15,1,0,0,0,18,16,1,0,0,0,18,17,1,0,0,0,19,1,1,0,0,0,20,21,
        5,1,0,0,21,22,3,2,1,0,22,23,5,2,0,0,23,26,1,0,0,0,24,26,3,12,6,0,
        25,20,1,0,0,0,25,24,1,0,0,0,26,3,1,0,0,0,27,28,3,2,1,0,28,29,5,3,
        0,0,29,30,3,2,1,0,30,5,1,0,0,0,31,32,3,2,1,0,32,33,5,4,0,0,33,34,
        3,2,1,0,34,7,1,0,0,0,35,36,3,2,1,0,36,37,5,5,0,0,37,38,3,2,1,0,38,
        9,1,0,0,0,39,40,3,2,1,0,40,41,5,6,0,0,41,42,3,2,1,0,42,11,1,0,0,
        0,43,44,5,7,0,0,44,13,1,0,0,0,2,18,25
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!dslParser.__ATN) {
            dslParser.__ATN = new antlr.ATNDeserializer().deserialize(dslParser._serializedATN);
        }

        return dslParser.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(dslParser.literalNames, dslParser.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return dslParser.vocabulary;
    }

    private static readonly decisionsToDFA = dslParser._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}

export class StartContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public multiply(): MultiplyContext | null {
        return this.getRuleContext(0, MultiplyContext);
    }
    public divide(): DivideContext | null {
        return this.getRuleContext(0, DivideContext);
    }
    public add(): AddContext | null {
        return this.getRuleContext(0, AddContext);
    }
    public subtract(): SubtractContext | null {
        return this.getRuleContext(0, SubtractContext);
    }
    public override get ruleIndex(): number {
        return dslParser.RULE_start;
    }
    public override enterRule(listener: dslListener): void {
        if(listener.enterStart) {
            listener.enterStart(this);
        }
    }
    public override exitRule(listener: dslListener): void {
        if(listener.exitStart) {
            listener.exitStart(this);
        }
    }
}


export class ExpressionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public expression(): ExpressionContext | null {
        return this.getRuleContext(0, ExpressionContext);
    }
    public number(): NumberContext | null {
        return this.getRuleContext(0, NumberContext);
    }
    public override get ruleIndex(): number {
        return dslParser.RULE_expression;
    }
    public override enterRule(listener: dslListener): void {
        if(listener.enterExpression) {
            listener.enterExpression(this);
        }
    }
    public override exitRule(listener: dslListener): void {
        if(listener.exitExpression) {
            listener.exitExpression(this);
        }
    }
}


export class MultiplyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext | null;
    public expression(i?: number): ExpressionContext[] | ExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        }

        return this.getRuleContext(i, ExpressionContext);
    }
    public override get ruleIndex(): number {
        return dslParser.RULE_multiply;
    }
    public override enterRule(listener: dslListener): void {
        if(listener.enterMultiply) {
            listener.enterMultiply(this);
        }
    }
    public override exitRule(listener: dslListener): void {
        if(listener.exitMultiply) {
            listener.exitMultiply(this);
        }
    }
}


export class DivideContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext | null;
    public expression(i?: number): ExpressionContext[] | ExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        }

        return this.getRuleContext(i, ExpressionContext);
    }
    public override get ruleIndex(): number {
        return dslParser.RULE_divide;
    }
    public override enterRule(listener: dslListener): void {
        if(listener.enterDivide) {
            listener.enterDivide(this);
        }
    }
    public override exitRule(listener: dslListener): void {
        if(listener.exitDivide) {
            listener.exitDivide(this);
        }
    }
}


export class AddContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext | null;
    public expression(i?: number): ExpressionContext[] | ExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        }

        return this.getRuleContext(i, ExpressionContext);
    }
    public override get ruleIndex(): number {
        return dslParser.RULE_add;
    }
    public override enterRule(listener: dslListener): void {
        if(listener.enterAdd) {
            listener.enterAdd(this);
        }
    }
    public override exitRule(listener: dslListener): void {
        if(listener.exitAdd) {
            listener.exitAdd(this);
        }
    }
}


export class SubtractContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext | null;
    public expression(i?: number): ExpressionContext[] | ExpressionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        }

        return this.getRuleContext(i, ExpressionContext);
    }
    public override get ruleIndex(): number {
        return dslParser.RULE_subtract;
    }
    public override enterRule(listener: dslListener): void {
        if(listener.enterSubtract) {
            listener.enterSubtract(this);
        }
    }
    public override exitRule(listener: dslListener): void {
        if(listener.exitSubtract) {
            listener.exitSubtract(this);
        }
    }
}


export class NumberContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public NUMBER(): antlr.TerminalNode {
        return this.getToken(dslParser.NUMBER, 0)!;
    }
    public override get ruleIndex(): number {
        return dslParser.RULE_number;
    }
    public override enterRule(listener: dslListener): void {
        if(listener.enterNumber) {
            listener.enterNumber(this);
        }
    }
    public override exitRule(listener: dslListener): void {
        if(listener.exitNumber) {
            listener.exitNumber(this);
        }
    }
}
