
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
    public static readonly ALIAS_KW = 11;
    public static readonly TERMINATOR = 12;
    public static readonly PREDICATE = 13;
    public static readonly ALIAS = 14;
    public static readonly NAME = 15;
    public static readonly NUMBER = 16;
    public static readonly PLAIN_WORD = 17;
    public static readonly GENERIC_REF = 18;
    public static readonly SINGLE_SUBJECT_REF = 19;
    public static readonly GROUP_SUBJECT_REF = 20;
    public static readonly SINGLE_OBJECT_REF = 21;
    public static readonly GROUP_OBJECT_REF = 22;
    public static readonly NEW_LINE = 23;
    public static readonly WS = 24;
    public static readonly COMMENT = 25;
    public static readonly RULE_program = 0;
    public static readonly RULE_fact = 1;
    public static readonly RULE_aliasDeclaration = 2;
    public static readonly RULE_sentence = 3;
    public static readonly RULE_token = 4;
    public static readonly RULE_list = 5;

    public static readonly literalNames = [
        null, "','", "'('", "')'", "'['", "']'", "';'", "'?'", "'!'", "'''", 
        "'='", "'alias'"
    ];

    public static readonly symbolicNames = [
        null, "COMMA", "LPAREN", "RPAREN", "LSQUARE", "RSQUARE", "SEMICOLON", 
        "QUESTION", "EXCLAMATION", "APOSTROPHE", "EQUALS", "ALIAS_KW", "TERMINATOR", 
        "PREDICATE", "ALIAS", "NAME", "NUMBER", "PLAIN_WORD", "GENERIC_REF", 
        "SINGLE_SUBJECT_REF", "GROUP_SUBJECT_REF", "SINGLE_OBJECT_REF", 
        "GROUP_OBJECT_REF", "NEW_LINE", "WS", "COMMENT"
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
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 17;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 1, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
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
                    case DSLParser.GENERIC_REF:
                    case DSLParser.SINGLE_SUBJECT_REF:
                    case DSLParser.GROUP_SUBJECT_REF:
                    case DSLParser.SINGLE_OBJECT_REF:
                    case DSLParser.GROUP_OBJECT_REF:
                        {
                        this.state = 13;
                        this.fact();
                        }
                        break;
                    case DSLParser.ALIAS_KW:
                        {
                        this.state = 14;
                        this.aliasDeclaration();
                        }
                        break;
                    default:
                        throw new antlr.NoViableAltException(this);
                    }
                    }
                }
                this.state = 19;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 1, this.context);
            }
            this.state = 23;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 23) {
                {
                {
                this.state = 20;
                this.match(DSLParser.NEW_LINE);
                }
                }
                this.state = 25;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 26;
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
            this.state = 28;
            this.sentence();
            this.state = 29;
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
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 31;
            this.match(DSLParser.ALIAS_KW);
            this.state = 32;
            this.match(DSLParser.PLAIN_WORD);
            this.state = 35;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 10) {
                {
                this.state = 33;
                this.match(DSLParser.EQUALS);
                this.state = 34;
                this.match(DSLParser.PREDICATE);
                }
            }

            this.state = 37;
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
            this.state = 40;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 39;
                this.token();
                }
                }
                this.state = 42;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 8381406) !== 0));
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
            this.state = 53;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case DSLParser.LSQUARE:
            case DSLParser.PREDICATE:
            case DSLParser.ALIAS:
            case DSLParser.NAME:
            case DSLParser.NUMBER:
            case DSLParser.PLAIN_WORD:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 49;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case DSLParser.NAME:
                case DSLParser.NUMBER:
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
                    }
                    break;
                case DSLParser.LSQUARE:
                    {
                    this.state = 45;
                    this.list();
                    }
                    break;
                case DSLParser.PREDICATE:
                    {
                    this.state = 46;
                    this.match(DSLParser.PREDICATE);
                    }
                    break;
                case DSLParser.ALIAS:
                    {
                    this.state = 47;
                    this.match(DSLParser.ALIAS);
                    }
                    break;
                case DSLParser.PLAIN_WORD:
                    {
                    this.state = 48;
                    this.match(DSLParser.PLAIN_WORD);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                break;
            case DSLParser.GENERIC_REF:
            case DSLParser.SINGLE_SUBJECT_REF:
            case DSLParser.GROUP_SUBJECT_REF:
            case DSLParser.SINGLE_OBJECT_REF:
            case DSLParser.GROUP_OBJECT_REF:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 51;
                _la = this.tokenStream.LA(1);
                if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 8126464) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                }
                break;
            case DSLParser.COMMA:
            case DSLParser.LPAREN:
            case DSLParser.RPAREN:
            case DSLParser.SEMICOLON:
            case DSLParser.QUESTION:
            case DSLParser.EXCLAMATION:
            case DSLParser.APOSTROPHE:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 52;
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
            this.state = 55;
            this.match(DSLParser.LSQUARE);
            this.state = 72;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 98320) !== 0)) {
                {
                this.state = 59;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case DSLParser.NAME:
                    {
                    this.state = 56;
                    this.match(DSLParser.NAME);
                    }
                    break;
                case DSLParser.NUMBER:
                    {
                    this.state = 57;
                    this.match(DSLParser.NUMBER);
                    }
                    break;
                case DSLParser.LSQUARE:
                    {
                    this.state = 58;
                    this.list();
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                this.state = 69;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 1) {
                    {
                    {
                    this.state = 61;
                    this.match(DSLParser.COMMA);
                    this.state = 65;
                    this.errorHandler.sync(this);
                    switch (this.tokenStream.LA(1)) {
                    case DSLParser.NAME:
                        {
                        this.state = 62;
                        this.match(DSLParser.NAME);
                        }
                        break;
                    case DSLParser.NUMBER:
                        {
                        this.state = 63;
                        this.match(DSLParser.NUMBER);
                        }
                        break;
                    case DSLParser.LSQUARE:
                        {
                        this.state = 64;
                        this.list();
                        }
                        break;
                    default:
                        throw new antlr.NoViableAltException(this);
                    }
                    }
                    }
                    this.state = 71;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 74;
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
        4,1,25,77,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,1,0,1,
        0,1,0,5,0,16,8,0,10,0,12,0,19,9,0,1,0,5,0,22,8,0,10,0,12,0,25,9,
        0,1,0,1,0,1,1,1,1,1,1,1,2,1,2,1,2,1,2,3,2,36,8,2,1,2,1,2,1,3,4,3,
        41,8,3,11,3,12,3,42,1,4,1,4,1,4,1,4,1,4,3,4,50,8,4,1,4,1,4,3,4,54,
        8,4,1,5,1,5,1,5,1,5,3,5,60,8,5,1,5,1,5,1,5,1,5,3,5,66,8,5,5,5,68,
        8,5,10,5,12,5,71,9,5,3,5,73,8,5,1,5,1,5,1,5,0,0,6,0,2,4,6,8,10,0,
        3,1,0,15,16,1,0,18,22,2,0,1,3,6,9,88,0,17,1,0,0,0,2,28,1,0,0,0,4,
        31,1,0,0,0,6,40,1,0,0,0,8,53,1,0,0,0,10,55,1,0,0,0,12,16,5,23,0,
        0,13,16,3,2,1,0,14,16,3,4,2,0,15,12,1,0,0,0,15,13,1,0,0,0,15,14,
        1,0,0,0,16,19,1,0,0,0,17,15,1,0,0,0,17,18,1,0,0,0,18,23,1,0,0,0,
        19,17,1,0,0,0,20,22,5,23,0,0,21,20,1,0,0,0,22,25,1,0,0,0,23,21,1,
        0,0,0,23,24,1,0,0,0,24,26,1,0,0,0,25,23,1,0,0,0,26,27,5,0,0,1,27,
        1,1,0,0,0,28,29,3,6,3,0,29,30,5,12,0,0,30,3,1,0,0,0,31,32,5,11,0,
        0,32,35,5,17,0,0,33,34,5,10,0,0,34,36,5,13,0,0,35,33,1,0,0,0,35,
        36,1,0,0,0,36,37,1,0,0,0,37,38,5,12,0,0,38,5,1,0,0,0,39,41,3,8,4,
        0,40,39,1,0,0,0,41,42,1,0,0,0,42,40,1,0,0,0,42,43,1,0,0,0,43,7,1,
        0,0,0,44,50,7,0,0,0,45,50,3,10,5,0,46,50,5,13,0,0,47,50,5,14,0,0,
        48,50,5,17,0,0,49,44,1,0,0,0,49,45,1,0,0,0,49,46,1,0,0,0,49,47,1,
        0,0,0,49,48,1,0,0,0,50,54,1,0,0,0,51,54,7,1,0,0,52,54,7,2,0,0,53,
        49,1,0,0,0,53,51,1,0,0,0,53,52,1,0,0,0,54,9,1,0,0,0,55,72,5,4,0,
        0,56,60,5,15,0,0,57,60,5,16,0,0,58,60,3,10,5,0,59,56,1,0,0,0,59,
        57,1,0,0,0,59,58,1,0,0,0,60,69,1,0,0,0,61,65,5,1,0,0,62,66,5,15,
        0,0,63,66,5,16,0,0,64,66,3,10,5,0,65,62,1,0,0,0,65,63,1,0,0,0,65,
        64,1,0,0,0,66,68,1,0,0,0,67,61,1,0,0,0,68,71,1,0,0,0,69,67,1,0,0,
        0,69,70,1,0,0,0,70,73,1,0,0,0,71,69,1,0,0,0,72,59,1,0,0,0,72,73,
        1,0,0,0,73,74,1,0,0,0,74,75,5,5,0,0,75,11,1,0,0,0,11,15,17,23,35,
        42,49,53,59,65,69,72
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
    public ALIAS_KW(): antlr.TerminalNode {
        return this.getToken(DSLParser.ALIAS_KW, 0)!;
    }
    public PLAIN_WORD(): antlr.TerminalNode {
        return this.getToken(DSLParser.PLAIN_WORD, 0)!;
    }
    public TERMINATOR(): antlr.TerminalNode {
        return this.getToken(DSLParser.TERMINATOR, 0)!;
    }
    public EQUALS(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.EQUALS, 0);
    }
    public PREDICATE(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.PREDICATE, 0);
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
    public NAME(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.NAME, 0);
    }
    public NUMBER(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.NUMBER, 0);
    }
    public GENERIC_REF(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.GENERIC_REF, 0);
    }
    public SINGLE_SUBJECT_REF(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.SINGLE_SUBJECT_REF, 0);
    }
    public GROUP_SUBJECT_REF(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.GROUP_SUBJECT_REF, 0);
    }
    public SINGLE_OBJECT_REF(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.SINGLE_OBJECT_REF, 0);
    }
    public GROUP_OBJECT_REF(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.GROUP_OBJECT_REF, 0);
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
    public list(): ListContext[];
    public list(i: number): ListContext | null;
    public list(i?: number): ListContext[] | ListContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ListContext);
        }

        return this.getRuleContext(i, ListContext);
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
