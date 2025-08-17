
import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { DSLListener } from "./DSLListener.js";
import { DSLVisitor } from "./DSLVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;


export class DSLParser extends antlr.Parser {
    public static readonly T__0 = 1;
    public static readonly T__1 = 2;
    public static readonly T__2 = 3;
    public static readonly LET = 4;
    public static readonly COMMA = 5;
    public static readonly PREDICATE = 6;
    public static readonly ALIAS = 7;
    public static readonly NAME = 8;
    public static readonly NUMBER = 9;
    public static readonly PLAIN_WORD = 10;
    public static readonly TERMINATOR = 11;
    public static readonly WS = 12;
    public static readonly COMMENT = 13;
    public static readonly RULE_program = 0;
    public static readonly RULE_fact = 1;
    public static readonly RULE_aliasDeclaration = 2;
    public static readonly RULE_sentence = 3;
    public static readonly RULE_token = 4;
    public static readonly RULE_list = 5;
    public static readonly RULE_atom = 6;

    public static readonly literalNames = [
        null, "'='", "'['", "']'", "'let'", "','", null, null, null, null, 
        null, "'.'"
    ];

    public static readonly symbolicNames = [
        null, null, null, null, "LET", "COMMA", "PREDICATE", "ALIAS", "NAME", 
        "NUMBER", "PLAIN_WORD", "TERMINATOR", "WS", "COMMENT"
    ];
    public static readonly ruleNames = [
        "program", "fact", "aliasDeclaration", "sentence", "token", "list", 
        "atom",
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
            this.state = 16;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 16;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case DSLParser.T__1:
                case DSLParser.PREDICATE:
                case DSLParser.ALIAS:
                case DSLParser.NAME:
                case DSLParser.NUMBER:
                case DSLParser.PLAIN_WORD:
                    {
                    this.state = 14;
                    this.fact();
                    }
                    break;
                case DSLParser.LET:
                    {
                    this.state = 15;
                    this.aliasDeclaration();
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 18;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 2004) !== 0));
            this.state = 20;
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
            this.state = 22;
            this.sentence();
            this.state = 23;
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
            this.state = 25;
            this.match(DSLParser.LET);
            this.state = 26;
            this.match(DSLParser.ALIAS);
            this.state = 27;
            this.match(DSLParser.T__0);
            this.state = 28;
            this.match(DSLParser.PREDICATE);
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
    public sentence(): SentenceContext {
        let localContext = new SentenceContext(this.context, this.state);
        this.enterRule(localContext, 6, DSLParser.RULE_sentence);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 32;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 31;
                this.token();
                }
                }
                this.state = 34;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1988) !== 0));
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
        try {
            this.state = 40;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case DSLParser.T__1:
            case DSLParser.NAME:
            case DSLParser.NUMBER:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 36;
                this.atom();
                }
                break;
            case DSLParser.PREDICATE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 37;
                this.match(DSLParser.PREDICATE);
                }
                break;
            case DSLParser.ALIAS:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 38;
                this.match(DSLParser.ALIAS);
                }
                break;
            case DSLParser.PLAIN_WORD:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 39;
                this.match(DSLParser.PLAIN_WORD);
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
            this.state = 42;
            this.match(DSLParser.T__1);
            this.state = 51;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 772) !== 0)) {
                {
                this.state = 43;
                this.atom();
                this.state = 48;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 5) {
                    {
                    {
                    this.state = 44;
                    this.match(DSLParser.COMMA);
                    this.state = 45;
                    this.atom();
                    }
                    }
                    this.state = 50;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 53;
            this.match(DSLParser.T__2);
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
    public atom(): AtomContext {
        let localContext = new AtomContext(this.context, this.state);
        this.enterRule(localContext, 12, DSLParser.RULE_atom);
        try {
            this.state = 58;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case DSLParser.NAME:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 55;
                this.match(DSLParser.NAME);
                }
                break;
            case DSLParser.NUMBER:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 56;
                this.match(DSLParser.NUMBER);
                }
                break;
            case DSLParser.T__1:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 57;
                this.list();
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

    public static readonly _serializedATN: number[] = [
        4,1,13,61,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,1,0,1,0,4,0,17,8,0,11,0,12,0,18,1,0,1,0,1,1,1,1,1,1,1,2,1,2,1,
        2,1,2,1,2,1,2,1,3,4,3,33,8,3,11,3,12,3,34,1,4,1,4,1,4,1,4,3,4,41,
        8,4,1,5,1,5,1,5,1,5,5,5,47,8,5,10,5,12,5,50,9,5,3,5,52,8,5,1,5,1,
        5,1,6,1,6,1,6,3,6,59,8,6,1,6,0,0,7,0,2,4,6,8,10,12,0,0,63,0,16,1,
        0,0,0,2,22,1,0,0,0,4,25,1,0,0,0,6,32,1,0,0,0,8,40,1,0,0,0,10,42,
        1,0,0,0,12,58,1,0,0,0,14,17,3,2,1,0,15,17,3,4,2,0,16,14,1,0,0,0,
        16,15,1,0,0,0,17,18,1,0,0,0,18,16,1,0,0,0,18,19,1,0,0,0,19,20,1,
        0,0,0,20,21,5,0,0,1,21,1,1,0,0,0,22,23,3,6,3,0,23,24,5,11,0,0,24,
        3,1,0,0,0,25,26,5,4,0,0,26,27,5,7,0,0,27,28,5,1,0,0,28,29,5,6,0,
        0,29,30,5,11,0,0,30,5,1,0,0,0,31,33,3,8,4,0,32,31,1,0,0,0,33,34,
        1,0,0,0,34,32,1,0,0,0,34,35,1,0,0,0,35,7,1,0,0,0,36,41,3,12,6,0,
        37,41,5,6,0,0,38,41,5,7,0,0,39,41,5,10,0,0,40,36,1,0,0,0,40,37,1,
        0,0,0,40,38,1,0,0,0,40,39,1,0,0,0,41,9,1,0,0,0,42,51,5,2,0,0,43,
        48,3,12,6,0,44,45,5,5,0,0,45,47,3,12,6,0,46,44,1,0,0,0,47,50,1,0,
        0,0,48,46,1,0,0,0,48,49,1,0,0,0,49,52,1,0,0,0,50,48,1,0,0,0,51,43,
        1,0,0,0,51,52,1,0,0,0,52,53,1,0,0,0,53,54,5,3,0,0,54,11,1,0,0,0,
        55,59,5,8,0,0,56,59,5,9,0,0,57,59,3,10,5,0,58,55,1,0,0,0,58,56,1,
        0,0,0,58,57,1,0,0,0,59,13,1,0,0,0,7,16,18,34,40,48,51,58
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
    public atom(): AtomContext | null {
        return this.getRuleContext(0, AtomContext);
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
    public atom(): AtomContext[];
    public atom(i: number): AtomContext | null;
    public atom(i?: number): AtomContext[] | AtomContext | null {
        if (i === undefined) {
            return this.getRuleContexts(AtomContext);
        }

        return this.getRuleContext(i, AtomContext);
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


export class AtomContext extends antlr.ParserRuleContext {
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
    public override get ruleIndex(): number {
        return DSLParser.RULE_atom;
    }
    public override enterRule(listener: DSLListener): void {
        if(listener.enterAtom) {
             listener.enterAtom(this);
        }
    }
    public override exitRule(listener: DSLListener): void {
        if(listener.exitAtom) {
             listener.exitAtom(this);
        }
    }
    public override accept<Result>(visitor: DSLVisitor<Result>): Result | null {
        if (visitor.visitAtom) {
            return visitor.visitAtom(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
