
import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { DSLListener } from "./DSLListener.js";
import { DSLVisitor } from "./DSLVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;


export class DSLParser extends antlr.Parser {
    public static readonly ATOM = 1;
    public static readonly PREDICATE = 2;
    public static readonly ALIAS = 3;
    public static readonly FILLER = 4;
    public static readonly STRING_LITERAL = 5;
    public static readonly NUMBER = 6;
    public static readonly IDENTIFIER = 7;
    public static readonly TERMINATOR = 8;
    public static readonly WS = 9;
    public static readonly COMMENT = 10;
    public static readonly RULE_program = 0;
    public static readonly RULE_fact = 1;
    public static readonly RULE_sentence = 2;
    public static readonly RULE_token = 3;

    public static readonly literalNames = [
        null, null, null, null, null, null, null, null, "'.'"
    ];

    public static readonly symbolicNames = [
        null, "ATOM", "PREDICATE", "ALIAS", "FILLER", "STRING_LITERAL", 
        "NUMBER", "IDENTIFIER", "TERMINATOR", "WS", "COMMENT"
    ];
    public static readonly ruleNames = [
        "program", "fact", "sentence", "token",
    ];

    public get grammarFileName(): string { return "DSL.g4"; }
    public get literalNames(): (string | null)[] { return DSLParser.literalNames; }
    public get symbolicNames(): (string | null)[] { return DSLParser.symbolicNames; }
    public get ruleNames(): string[] { return DSLParser.ruleNames; }
    public get serializedATN(): number[] { return DSLParser._serializedATN; }

    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException {
        return new antlr.FailedPredicateException(this, predicate, message);
    }

    public constructor(input: antlr.TokenStream) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, DSLParser._ATN, DSLParser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    public program(): ProgramContext {
        let localContext = new ProgramContext(this.context, this.state);
        this.enterRule(localContext, 0, DSLParser.RULE_program);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 9;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 8;
                this.fact();
                }
                }
                this.state = 11;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 30) !== 0));
            this.state = 13;
            this.match(DSLParser.EOF);
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
    public fact(): FactContext {
        let localContext = new FactContext(this.context, this.state);
        this.enterRule(localContext, 2, DSLParser.RULE_fact);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 15;
            this.sentence();
            this.state = 16;
            this.match(DSLParser.TERMINATOR);
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
    public sentence(): SentenceContext {
        let localContext = new SentenceContext(this.context, this.state);
        this.enterRule(localContext, 4, DSLParser.RULE_sentence);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 19;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 18;
                this.token();
                }
                }
                this.state = 21;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 30) !== 0));

                      // Action placeholder: Validate exactly one predicate and parse atoms/predicate into structure
                    
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
    public token(): TokenContext {
        let localContext = new TokenContext(this.context, this.state);
        this.enterRule(localContext, 6, DSLParser.RULE_token);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 25;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 30) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
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
        4,1,10,28,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,1,0,4,0,10,8,0,11,0,12,
        0,11,1,0,1,0,1,1,1,1,1,1,1,2,4,2,20,8,2,11,2,12,2,21,1,2,1,2,1,3,
        1,3,1,3,0,0,4,0,2,4,6,0,1,1,0,1,4,25,0,9,1,0,0,0,2,15,1,0,0,0,4,
        19,1,0,0,0,6,25,1,0,0,0,8,10,3,2,1,0,9,8,1,0,0,0,10,11,1,0,0,0,11,
        9,1,0,0,0,11,12,1,0,0,0,12,13,1,0,0,0,13,14,5,0,0,1,14,1,1,0,0,0,
        15,16,3,4,2,0,16,17,5,8,0,0,17,3,1,0,0,0,18,20,3,6,3,0,19,18,1,0,
        0,0,20,21,1,0,0,0,21,19,1,0,0,0,21,22,1,0,0,0,22,23,1,0,0,0,23,24,
        6,2,-1,0,24,5,1,0,0,0,25,26,7,0,0,0,26,7,1,0,0,0,2,11,21
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!DSLParser.__ATN) {
            DSLParser.__ATN = new antlr.ATNDeserializer().deserialize(DSLParser._serializedATN);
        }

        return DSLParser.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(DSLParser.literalNames, DSLParser.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return DSLParser.vocabulary;
    }

    private static readonly decisionsToDFA = DSLParser._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}

export class ProgramContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(DSLParser.EOF, 0)!;
    }
    public fact(): FactContext[];
    public fact(i: number): FactContext | null;
    public fact(i?: number): FactContext[] | FactContext | null {
        if (i === undefined) {
            return this.getRuleContexts(FactContext);
        }

        return this.getRuleContext(i, FactContext);
    }
    public override get ruleIndex(): number {
        return DSLParser.RULE_program;
    }
    public override enterRule(listener: DSLListener): void {
        if(listener.enterProgram) {
             listener.enterProgram(this);
        }
    }
    public override exitRule(listener: DSLListener): void {
        if(listener.exitProgram) {
             listener.exitProgram(this);
        }
    }
    public override accept<Result>(visitor: DSLVisitor<Result>): Result | null {
        if (visitor.visitProgram) {
            return visitor.visitProgram(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FactContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public sentence(): SentenceContext {
        return this.getRuleContext(0, SentenceContext)!;
    }
    public TERMINATOR(): antlr.TerminalNode {
        return this.getToken(DSLParser.TERMINATOR, 0)!;
    }
    public override get ruleIndex(): number {
        return DSLParser.RULE_fact;
    }
    public override enterRule(listener: DSLListener): void {
        if(listener.enterFact) {
             listener.enterFact(this);
        }
    }
    public override exitRule(listener: DSLListener): void {
        if(listener.exitFact) {
             listener.exitFact(this);
        }
    }
    public override accept<Result>(visitor: DSLVisitor<Result>): Result | null {
        if (visitor.visitFact) {
            return visitor.visitFact(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class SentenceContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public token(): TokenContext[];
    public token(i: number): TokenContext | null;
    public token(i?: number): TokenContext[] | TokenContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TokenContext);
        }

        return this.getRuleContext(i, TokenContext);
    }
    public override get ruleIndex(): number {
        return DSLParser.RULE_sentence;
    }
    public override enterRule(listener: DSLListener): void {
        if(listener.enterSentence) {
             listener.enterSentence(this);
        }
    }
    public override exitRule(listener: DSLListener): void {
        if(listener.exitSentence) {
             listener.exitSentence(this);
        }
    }
    public override accept<Result>(visitor: DSLVisitor<Result>): Result | null {
        if (visitor.visitSentence) {
            return visitor.visitSentence(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class TokenContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ATOM(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.ATOM, 0);
    }
    public PREDICATE(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.PREDICATE, 0);
    }
    public ALIAS(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.ALIAS, 0);
    }
    public FILLER(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.FILLER, 0);
    }
    public override get ruleIndex(): number {
        return DSLParser.RULE_token;
    }
    public override enterRule(listener: DSLListener): void {
        if(listener.enterToken) {
             listener.enterToken(this);
        }
    }
    public override exitRule(listener: DSLListener): void {
        if(listener.exitToken) {
             listener.exitToken(this);
        }
    }
    public override accept<Result>(visitor: DSLVisitor<Result>): Result | null {
        if (visitor.visitToken) {
            return visitor.visitToken(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
