
import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { DSLListener } from "./DSLListener.js";
import { DSLVisitor } from "./DSLVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;


export class DSLParser extends antlr.Parser {
    public static readonly T__0 = 1;
    public static readonly LET = 2;
    public static readonly ATOM = 3;
    public static readonly PREDICATE = 4;
    public static readonly ALIAS = 5;
    public static readonly STRING_LITERAL = 6;
    public static readonly NUMBER = 7;
    public static readonly FILLER = 8;
    public static readonly IDENTIFIER = 9;
    public static readonly TERMINATOR = 10;
    public static readonly WS = 11;
    public static readonly COMMENT = 12;
    public static readonly RULE_program = 0;
    public static readonly RULE_fact = 1;
    public static readonly RULE_aliasDeclaration = 2;
    public static readonly RULE_sentence = 3;
    public static readonly RULE_token = 4;

    public static readonly literalNames = [
        null, "'='", "'let'", null, null, null, null, null, null, null, 
        "'.'"
    ];

    public static readonly symbolicNames = [
        null, null, "LET", "ATOM", "PREDICATE", "ALIAS", "STRING_LITERAL", 
        "NUMBER", "FILLER", "IDENTIFIER", "TERMINATOR", "WS", "COMMENT"
    ];
    public static readonly ruleNames = [
        "program", "fact", "aliasDeclaration", "sentence", "token",
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
            this.state = 12;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 12;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case DSLParser.ATOM:
                case DSLParser.PREDICATE:
                case DSLParser.ALIAS:
                case DSLParser.FILLER:
                    {
                    this.state = 10;
                    this.fact();
                    }
                    break;
                case DSLParser.LET:
                    {
                    this.state = 11;
                    this.aliasDeclaration();
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 14;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 316) !== 0));
            this.state = 16;
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
            this.state = 18;
            this.sentence();
            this.state = 19;
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
    public aliasDeclaration(): AliasDeclarationContext {
        let localContext = new AliasDeclarationContext(this.context, this.state);
        this.enterRule(localContext, 4, DSLParser.RULE_aliasDeclaration);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 21;
            this.match(DSLParser.LET);
            this.state = 22;
            this.match(DSLParser.ALIAS);
            this.state = 23;
            this.match(DSLParser.T__0);
            this.state = 24;
            this.match(DSLParser.PREDICATE);
            this.state = 25;
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
        this.enterRule(localContext, 6, DSLParser.RULE_sentence);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 28;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 27;
                this.token();
                }
                }
                this.state = 30;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 312) !== 0));
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
        this.enterRule(localContext, 8, DSLParser.RULE_token);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 32;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 312) !== 0))) {
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
        4,1,12,35,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,1,0,1,0,4,0,13,
        8,0,11,0,12,0,14,1,0,1,0,1,1,1,1,1,1,1,2,1,2,1,2,1,2,1,2,1,2,1,3,
        4,3,29,8,3,11,3,12,3,30,1,4,1,4,1,4,0,0,5,0,2,4,6,8,0,1,2,0,3,5,
        8,8,32,0,12,1,0,0,0,2,18,1,0,0,0,4,21,1,0,0,0,6,28,1,0,0,0,8,32,
        1,0,0,0,10,13,3,2,1,0,11,13,3,4,2,0,12,10,1,0,0,0,12,11,1,0,0,0,
        13,14,1,0,0,0,14,12,1,0,0,0,14,15,1,0,0,0,15,16,1,0,0,0,16,17,5,
        0,0,1,17,1,1,0,0,0,18,19,3,6,3,0,19,20,5,10,0,0,20,3,1,0,0,0,21,
        22,5,2,0,0,22,23,5,5,0,0,23,24,5,1,0,0,24,25,5,4,0,0,25,26,5,10,
        0,0,26,5,1,0,0,0,27,29,3,8,4,0,28,27,1,0,0,0,29,30,1,0,0,0,30,28,
        1,0,0,0,30,31,1,0,0,0,31,7,1,0,0,0,32,33,7,0,0,0,33,9,1,0,0,0,3,
        12,14,30
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
    public aliasDeclaration(): AliasDeclarationContext[];
    public aliasDeclaration(i: number): AliasDeclarationContext | null;
    public aliasDeclaration(i?: number): AliasDeclarationContext[] | AliasDeclarationContext | null {
        if (i === undefined) {
            return this.getRuleContexts(AliasDeclarationContext);
        }

        return this.getRuleContext(i, AliasDeclarationContext);
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


export class AliasDeclarationContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LET(): antlr.TerminalNode {
        return this.getToken(DSLParser.LET, 0)!;
    }
    public ALIAS(): antlr.TerminalNode {
        return this.getToken(DSLParser.ALIAS, 0)!;
    }
    public PREDICATE(): antlr.TerminalNode {
        return this.getToken(DSLParser.PREDICATE, 0)!;
    }
    public TERMINATOR(): antlr.TerminalNode {
        return this.getToken(DSLParser.TERMINATOR, 0)!;
    }
    public override get ruleIndex(): number {
        return DSLParser.RULE_aliasDeclaration;
    }
    public override enterRule(listener: DSLListener): void {
        if(listener.enterAliasDeclaration) {
             listener.enterAliasDeclaration(this);
        }
    }
    public override exitRule(listener: DSLListener): void {
        if(listener.exitAliasDeclaration) {
             listener.exitAliasDeclaration(this);
        }
    }
    public override accept<Result>(visitor: DSLVisitor<Result>): Result | null {
        if (visitor.visitAliasDeclaration) {
            return visitor.visitAliasDeclaration(this);
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
