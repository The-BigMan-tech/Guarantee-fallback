
import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { DSLListener } from "./DSLListener.js";
import { DSLVisitor } from "./DSLVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;


export class DSLParser extends antlr.Parser {
    public static readonly COMMA = 1;
    public static readonly LPAREN = 2;
    public static readonly RPAREN = 3;
    public static readonly LSQUARE = 4;
    public static readonly RSQUARE = 5;
    public static readonly SEMICOLON = 6;
    public static readonly QUESTION = 7;
    public static readonly EXCLAMATION = 8;
    public static readonly APOSTROPHE = 9;
    public static readonly EQUALS = 10;
    public static readonly LET = 11;
    public static readonly TERMINATOR = 12;
    public static readonly PREDICATE = 13;
    public static readonly ALIAS = 14;
    public static readonly NAME = 15;
    public static readonly NUMBER = 16;
    public static readonly PLAIN_WORD = 17;
    public static readonly NEW_LINE = 18;
    public static readonly WS = 19;
    public static readonly COMMENT = 20;
    public static readonly RULE_program = 0;
    public static readonly RULE_fact = 1;
    public static readonly RULE_aliasDeclaration = 2;
    public static readonly RULE_sentence = 3;
    public static readonly RULE_token = 4;
    public static readonly RULE_list = 5;

    public static readonly literalNames = [
        null, "','", "'('", "')'", "'['", "']'", "';'", "'?'", "'!'", "'''", 
        "'='", "'let'"
    ];

    public static readonly symbolicNames = [
        null, "COMMA", "LPAREN", "RPAREN", "LSQUARE", "RSQUARE", "SEMICOLON", 
        "QUESTION", "EXCLAMATION", "APOSTROPHE", "EQUALS", "LET", "TERMINATOR", 
        "PREDICATE", "ALIAS", "NAME", "NUMBER", "PLAIN_WORD", "NEW_LINE", 
        "WS", "COMMENT"
    ];
    public static readonly ruleNames = [
        "program", "fact", "aliasDeclaration", "sentence", "token", "list",
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
            this.state = 15;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 15;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case DSLParser.NEW_LINE:
                    {
                    this.state = 12;
                    this.match(DSLParser.NEW_LINE);
                    }
                    break;
                case DSLParser.COMMA:
                case DSLParser.LPAREN:
                case DSLParser.RPAREN:
                case DSLParser.LSQUARE:
                case DSLParser.SEMICOLON:
                case DSLParser.QUESTION:
                case DSLParser.EXCLAMATION:
                case DSLParser.APOSTROPHE:
                case DSLParser.PREDICATE:
                case DSLParser.ALIAS:
                case DSLParser.NAME:
                case DSLParser.NUMBER:
                case DSLParser.PLAIN_WORD:
                    {
                    this.state = 13;
                    this.fact();
                    }
                    break;
                case DSLParser.LET:
                    {
                    this.state = 14;
                    this.aliasDeclaration();
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 17;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 519134) !== 0));
            this.state = 19;
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
            this.state = 21;
            this.sentence();
            this.state = 22;
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
            this.state = 24;
            this.match(DSLParser.LET);
            this.state = 25;
            this.match(DSLParser.PLAIN_WORD);
            this.state = 26;
            this.match(DSLParser.EQUALS);
            this.state = 27;
            this.match(DSLParser.PREDICATE);
            this.state = 28;
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
            this.state = 31;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 30;
                this.token();
                }
                }
                this.state = 33;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 254942) !== 0));
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
            this.state = 41;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case DSLParser.NAME:
            case DSLParser.NUMBER:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 35;
                _la = this.tokenStream.LA(1);
                if(!(_la === 15 || _la === 16)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                }
                break;
            case DSLParser.LSQUARE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 36;
                this.list();
                }
                break;
            case DSLParser.PREDICATE:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 37;
                this.match(DSLParser.PREDICATE);
                }
                break;
            case DSLParser.ALIAS:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 38;
                this.match(DSLParser.ALIAS);
                }
                break;
            case DSLParser.PLAIN_WORD:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 39;
                this.match(DSLParser.PLAIN_WORD);
                }
                break;
            case DSLParser.COMMA:
            case DSLParser.LPAREN:
            case DSLParser.RPAREN:
            case DSLParser.SEMICOLON:
            case DSLParser.QUESTION:
            case DSLParser.EXCLAMATION:
            case DSLParser.APOSTROPHE:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 40;
                _la = this.tokenStream.LA(1);
                if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 974) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
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
    public list(): ListContext {
        let localContext = new ListContext(this.context, this.state);
        this.enterRule(localContext, 10, DSLParser.RULE_list);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 43;
            this.match(DSLParser.LSQUARE);
            this.state = 52;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 15 || _la === 16) {
                {
                this.state = 44;
                _la = this.tokenStream.LA(1);
                if(!(_la === 15 || _la === 16)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 49;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 1) {
                    {
                    {
                    this.state = 45;
                    this.match(DSLParser.COMMA);
                    this.state = 46;
                    _la = this.tokenStream.LA(1);
                    if(!(_la === 15 || _la === 16)) {
                    this.errorHandler.recoverInline(this);
                    }
                    else {
                        this.errorHandler.reportMatch(this);
                        this.consume();
                    }
                    }
                    }
                    this.state = 51;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 54;
            this.match(DSLParser.RSQUARE);
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
        4,1,20,57,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,1,0,1,
        0,1,0,4,0,16,8,0,11,0,12,0,17,1,0,1,0,1,1,1,1,1,1,1,2,1,2,1,2,1,
        2,1,2,1,2,1,3,4,3,32,8,3,11,3,12,3,33,1,4,1,4,1,4,1,4,1,4,1,4,3,
        4,42,8,4,1,5,1,5,1,5,1,5,5,5,48,8,5,10,5,12,5,51,9,5,3,5,53,8,5,
        1,5,1,5,1,5,0,0,6,0,2,4,6,8,10,0,2,1,0,15,16,2,0,1,3,6,9,61,0,15,
        1,0,0,0,2,21,1,0,0,0,4,24,1,0,0,0,6,31,1,0,0,0,8,41,1,0,0,0,10,43,
        1,0,0,0,12,16,5,18,0,0,13,16,3,2,1,0,14,16,3,4,2,0,15,12,1,0,0,0,
        15,13,1,0,0,0,15,14,1,0,0,0,16,17,1,0,0,0,17,15,1,0,0,0,17,18,1,
        0,0,0,18,19,1,0,0,0,19,20,5,0,0,1,20,1,1,0,0,0,21,22,3,6,3,0,22,
        23,5,12,0,0,23,3,1,0,0,0,24,25,5,11,0,0,25,26,5,17,0,0,26,27,5,10,
        0,0,27,28,5,13,0,0,28,29,5,12,0,0,29,5,1,0,0,0,30,32,3,8,4,0,31,
        30,1,0,0,0,32,33,1,0,0,0,33,31,1,0,0,0,33,34,1,0,0,0,34,7,1,0,0,
        0,35,42,7,0,0,0,36,42,3,10,5,0,37,42,5,13,0,0,38,42,5,14,0,0,39,
        42,5,17,0,0,40,42,7,1,0,0,41,35,1,0,0,0,41,36,1,0,0,0,41,37,1,0,
        0,0,41,38,1,0,0,0,41,39,1,0,0,0,41,40,1,0,0,0,42,9,1,0,0,0,43,52,
        5,4,0,0,44,49,7,0,0,0,45,46,5,1,0,0,46,48,7,0,0,0,47,45,1,0,0,0,
        48,51,1,0,0,0,49,47,1,0,0,0,49,50,1,0,0,0,50,53,1,0,0,0,51,49,1,
        0,0,0,52,44,1,0,0,0,52,53,1,0,0,0,53,54,1,0,0,0,54,55,5,5,0,0,55,
        11,1,0,0,0,6,15,17,33,41,49,52
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
    public NEW_LINE(): antlr.TerminalNode[];
    public NEW_LINE(i: number): antlr.TerminalNode | null;
    public NEW_LINE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(DSLParser.NEW_LINE);
    	} else {
    		return this.getToken(DSLParser.NEW_LINE, i);
    	}
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
    public PLAIN_WORD(): antlr.TerminalNode {
        return this.getToken(DSLParser.PLAIN_WORD, 0)!;
    }
    public EQUALS(): antlr.TerminalNode {
        return this.getToken(DSLParser.EQUALS, 0)!;
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
    public NAME(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.NAME, 0);
    }
    public NUMBER(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.NUMBER, 0);
    }
    public list(): ListContext | null {
        return this.getRuleContext(0, ListContext);
    }
    public PREDICATE(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.PREDICATE, 0);
    }
    public ALIAS(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.ALIAS, 0);
    }
    public PLAIN_WORD(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.PLAIN_WORD, 0);
    }
    public COMMA(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.COMMA, 0);
    }
    public LPAREN(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.LPAREN, 0);
    }
    public RPAREN(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.RPAREN, 0);
    }
    public SEMICOLON(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.SEMICOLON, 0);
    }
    public QUESTION(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.QUESTION, 0);
    }
    public EXCLAMATION(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.EXCLAMATION, 0);
    }
    public APOSTROPHE(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.APOSTROPHE, 0);
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


export class ListContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LSQUARE(): antlr.TerminalNode {
        return this.getToken(DSLParser.LSQUARE, 0)!;
    }
    public RSQUARE(): antlr.TerminalNode {
        return this.getToken(DSLParser.RSQUARE, 0)!;
    }
    public NAME(): antlr.TerminalNode[];
    public NAME(i: number): antlr.TerminalNode | null;
    public NAME(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(DSLParser.NAME);
    	} else {
    		return this.getToken(DSLParser.NAME, i);
    	}
    }
    public NUMBER(): antlr.TerminalNode[];
    public NUMBER(i: number): antlr.TerminalNode | null;
    public NUMBER(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(DSLParser.NUMBER);
    	} else {
    		return this.getToken(DSLParser.NUMBER, i);
    	}
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(DSLParser.COMMA);
    	} else {
    		return this.getToken(DSLParser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return DSLParser.RULE_list;
    }
    public override enterRule(listener: DSLListener): void {
        if(listener.enterList) {
             listener.enterList(this);
        }
    }
    public override exitRule(listener: DSLListener): void {
        if(listener.exitList) {
             listener.exitList(this);
        }
    }
    public override accept<Result>(visitor: DSLVisitor<Result>): Result | null {
        if (visitor.visitList) {
            return visitor.visitList(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
