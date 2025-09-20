
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
    public static readonly HASH = 9;
    public static readonly APOSTROPHE = 10;
    public static readonly EQUALS = 11;
    public static readonly ALIAS_KW = 12;
    public static readonly TERMINATOR = 13;
    public static readonly PREDICATE = 14;
    public static readonly ALIAS = 15;
    public static readonly NAME = 16;
    public static readonly NUMBER = 17;
    public static readonly PLAIN_WORD = 18;
    public static readonly GENERIC_REF = 19;
    public static readonly SINGLE_SUBJECT_REF = 20;
    public static readonly GROUP_SUBJECT_REF = 21;
    public static readonly SINGLE_OBJECT_REF = 22;
    public static readonly GROUP_OBJECT_REF = 23;
    public static readonly NEW_LINE = 24;
    public static readonly WS = 25;
    public static readonly COMMENT = 26;
    public static readonly RULE_program = 0;
    public static readonly RULE_fact = 1;
    public static readonly RULE_aliasDeclaration = 2;
    public static readonly RULE_sentence = 3;
    public static readonly RULE_token = 4;
    public static readonly RULE_list = 5;
    public static readonly RULE_primitive = 6;
    public static readonly RULE_ref = 7;

    public static readonly literalNames = [
        null, "','", "'('", "')'", "'['", "']'", "';'", "'?'", "'!'", "'#'", 
        "'''", "'='", "'alias'"
    ];

    public static readonly symbolicNames = [
        null, "COMMA", "LPAREN", "RPAREN", "LSQUARE", "RSQUARE", "SEMICOLON", 
        "QUESTION", "EXCLAMATION", "HASH", "APOSTROPHE", "EQUALS", "ALIAS_KW", 
        "TERMINATOR", "PREDICATE", "ALIAS", "NAME", "NUMBER", "PLAIN_WORD", 
        "GENERIC_REF", "SINGLE_SUBJECT_REF", "GROUP_SUBJECT_REF", "SINGLE_OBJECT_REF", 
        "GROUP_OBJECT_REF", "NEW_LINE", "WS", "COMMENT"
    ];
    public static readonly ruleNames = [
        "program", "fact", "aliasDeclaration", "sentence", "token", "list", 
        "primitive", "ref",
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
            this.state = 26;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 3, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    this.state = 24;
                    this.errorHandler.sync(this);
                    switch (this.tokenStream.LA(1)) {
                    case DSLParser.NEW_LINE:
                        {
                        this.state = 16;
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
                    case DSLParser.HASH:
                    case DSLParser.APOSTROPHE:
                    case DSLParser.ALIAS_KW:
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
                        {
                        this.state = 19;
                        this.errorHandler.sync(this);
                        switch (this.tokenStream.LA(1)) {
                        case DSLParser.COMMA:
                        case DSLParser.LPAREN:
                        case DSLParser.RPAREN:
                        case DSLParser.LSQUARE:
                        case DSLParser.SEMICOLON:
                        case DSLParser.QUESTION:
                        case DSLParser.EXCLAMATION:
                        case DSLParser.HASH:
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
                            this.state = 17;
                            this.fact();
                            }
                            break;
                        case DSLParser.ALIAS_KW:
                            {
                            this.state = 18;
                            this.aliasDeclaration();
                            }
                            break;
                        default:
                            throw new antlr.NoViableAltException(this);
                        }
                        this.state = 22;
                        this.errorHandler.sync(this);
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 1, this.context) ) {
                        case 1:
                            {
                            this.state = 21;
                            this.match(DSLParser.NEW_LINE);
                            }
                            break;
                        }
                        }
                        }
                        break;
                    default:
                        throw new antlr.NoViableAltException(this);
                    }
                    }
                }
                this.state = 28;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 3, this.context);
            }
            this.state = 32;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 24) {
                {
                {
                this.state = 29;
                this.match(DSLParser.NEW_LINE);
                }
                }
                this.state = 34;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 35;
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
            this.state = 37;
            this.sentence();
            this.state = 38;
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
            this.state = 40;
            this.match(DSLParser.ALIAS_KW);
            this.state = 41;
            this.match(DSLParser.PLAIN_WORD);
            this.state = 44;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 11) {
                {
                this.state = 42;
                this.match(DSLParser.EQUALS);
                this.state = 43;
                this.match(DSLParser.PREDICATE);
                }
            }

            this.state = 46;
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
            this.state = 49;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 48;
                this.token();
                }
                }
                this.state = 51;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 16762846) !== 0));
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
            this.state = 62;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case DSLParser.LSQUARE:
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
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 59;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case DSLParser.NAME:
                case DSLParser.NUMBER:
                    {
                    this.state = 53;
                    this.primitive();
                    }
                    break;
                case DSLParser.LSQUARE:
                    {
                    this.state = 54;
                    this.list();
                    }
                    break;
                case DSLParser.GENERIC_REF:
                case DSLParser.SINGLE_SUBJECT_REF:
                case DSLParser.GROUP_SUBJECT_REF:
                case DSLParser.SINGLE_OBJECT_REF:
                case DSLParser.GROUP_OBJECT_REF:
                    {
                    this.state = 55;
                    this.ref();
                    }
                    break;
                case DSLParser.PREDICATE:
                    {
                    this.state = 56;
                    this.match(DSLParser.PREDICATE);
                    }
                    break;
                case DSLParser.ALIAS:
                    {
                    this.state = 57;
                    this.match(DSLParser.ALIAS);
                    }
                    break;
                case DSLParser.PLAIN_WORD:
                    {
                    this.state = 58;
                    this.match(DSLParser.PLAIN_WORD);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                break;
            case DSLParser.COMMA:
            case DSLParser.LPAREN:
            case DSLParser.RPAREN:
            case DSLParser.SEMICOLON:
            case DSLParser.QUESTION:
            case DSLParser.EXCLAMATION:
            case DSLParser.HASH:
            case DSLParser.APOSTROPHE:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 61;
                _la = this.tokenStream.LA(1);
                if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 1998) !== 0))) {
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
            this.state = 64;
            this.match(DSLParser.LSQUARE);
            this.state = 81;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 16449552) !== 0)) {
                {
                this.state = 68;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case DSLParser.NAME:
                case DSLParser.NUMBER:
                    {
                    this.state = 65;
                    this.primitive();
                    }
                    break;
                case DSLParser.GENERIC_REF:
                case DSLParser.SINGLE_SUBJECT_REF:
                case DSLParser.GROUP_SUBJECT_REF:
                case DSLParser.SINGLE_OBJECT_REF:
                case DSLParser.GROUP_OBJECT_REF:
                    {
                    this.state = 66;
                    this.ref();
                    }
                    break;
                case DSLParser.LSQUARE:
                    {
                    this.state = 67;
                    this.list();
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                this.state = 78;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 1) {
                    {
                    {
                    this.state = 70;
                    this.match(DSLParser.COMMA);
                    this.state = 74;
                    this.errorHandler.sync(this);
                    switch (this.tokenStream.LA(1)) {
                    case DSLParser.NAME:
                    case DSLParser.NUMBER:
                        {
                        this.state = 71;
                        this.primitive();
                        }
                        break;
                    case DSLParser.GENERIC_REF:
                    case DSLParser.SINGLE_SUBJECT_REF:
                    case DSLParser.GROUP_SUBJECT_REF:
                    case DSLParser.SINGLE_OBJECT_REF:
                    case DSLParser.GROUP_OBJECT_REF:
                        {
                        this.state = 72;
                        this.ref();
                        }
                        break;
                    case DSLParser.LSQUARE:
                        {
                        this.state = 73;
                        this.list();
                        }
                        break;
                    default:
                        throw new antlr.NoViableAltException(this);
                    }
                    }
                    }
                    this.state = 80;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 83;
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
    public primitive(): PrimitiveContext {
        let localContext = new PrimitiveContext(this.context, this.state);
        this.enterRule(localContext, 12, DSLParser.RULE_primitive);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 85;
            _la = this.tokenStream.LA(1);
            if(!(_la === 16 || _la === 17)) {
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
    public ref(): RefContext {
        let localContext = new RefContext(this.context, this.state);
        this.enterRule(localContext, 14, DSLParser.RULE_ref);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 87;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 16252928) !== 0))) {
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
        4,1,26,90,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,1,0,1,0,1,0,3,0,20,8,0,1,0,3,0,23,8,0,5,0,25,8,0,10,0,
        12,0,28,9,0,1,0,5,0,31,8,0,10,0,12,0,34,9,0,1,0,1,0,1,1,1,1,1,1,
        1,2,1,2,1,2,1,2,3,2,45,8,2,1,2,1,2,1,3,4,3,50,8,3,11,3,12,3,51,1,
        4,1,4,1,4,1,4,1,4,1,4,3,4,60,8,4,1,4,3,4,63,8,4,1,5,1,5,1,5,1,5,
        3,5,69,8,5,1,5,1,5,1,5,1,5,3,5,75,8,5,5,5,77,8,5,10,5,12,5,80,9,
        5,3,5,82,8,5,1,5,1,5,1,6,1,6,1,7,1,7,1,7,0,0,8,0,2,4,6,8,10,12,14,
        0,3,2,0,1,3,6,10,1,0,16,17,1,0,19,23,100,0,26,1,0,0,0,2,37,1,0,0,
        0,4,40,1,0,0,0,6,49,1,0,0,0,8,62,1,0,0,0,10,64,1,0,0,0,12,85,1,0,
        0,0,14,87,1,0,0,0,16,25,5,24,0,0,17,20,3,2,1,0,18,20,3,4,2,0,19,
        17,1,0,0,0,19,18,1,0,0,0,20,22,1,0,0,0,21,23,5,24,0,0,22,21,1,0,
        0,0,22,23,1,0,0,0,23,25,1,0,0,0,24,16,1,0,0,0,24,19,1,0,0,0,25,28,
        1,0,0,0,26,24,1,0,0,0,26,27,1,0,0,0,27,32,1,0,0,0,28,26,1,0,0,0,
        29,31,5,24,0,0,30,29,1,0,0,0,31,34,1,0,0,0,32,30,1,0,0,0,32,33,1,
        0,0,0,33,35,1,0,0,0,34,32,1,0,0,0,35,36,5,0,0,1,36,1,1,0,0,0,37,
        38,3,6,3,0,38,39,5,13,0,0,39,3,1,0,0,0,40,41,5,12,0,0,41,44,5,18,
        0,0,42,43,5,11,0,0,43,45,5,14,0,0,44,42,1,0,0,0,44,45,1,0,0,0,45,
        46,1,0,0,0,46,47,5,13,0,0,47,5,1,0,0,0,48,50,3,8,4,0,49,48,1,0,0,
        0,50,51,1,0,0,0,51,49,1,0,0,0,51,52,1,0,0,0,52,7,1,0,0,0,53,60,3,
        12,6,0,54,60,3,10,5,0,55,60,3,14,7,0,56,60,5,14,0,0,57,60,5,15,0,
        0,58,60,5,18,0,0,59,53,1,0,0,0,59,54,1,0,0,0,59,55,1,0,0,0,59,56,
        1,0,0,0,59,57,1,0,0,0,59,58,1,0,0,0,60,63,1,0,0,0,61,63,7,0,0,0,
        62,59,1,0,0,0,62,61,1,0,0,0,63,9,1,0,0,0,64,81,5,4,0,0,65,69,3,12,
        6,0,66,69,3,14,7,0,67,69,3,10,5,0,68,65,1,0,0,0,68,66,1,0,0,0,68,
        67,1,0,0,0,69,78,1,0,0,0,70,74,5,1,0,0,71,75,3,12,6,0,72,75,3,14,
        7,0,73,75,3,10,5,0,74,71,1,0,0,0,74,72,1,0,0,0,74,73,1,0,0,0,75,
        77,1,0,0,0,76,70,1,0,0,0,77,80,1,0,0,0,78,76,1,0,0,0,78,79,1,0,0,
        0,79,82,1,0,0,0,80,78,1,0,0,0,81,68,1,0,0,0,81,82,1,0,0,0,82,83,
        1,0,0,0,83,84,5,5,0,0,84,11,1,0,0,0,85,86,7,1,0,0,86,13,1,0,0,0,
        87,88,7,2,0,0,88,15,1,0,0,0,13,19,22,24,26,32,44,51,59,62,68,74,
        78,81
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
    public primitive(): PrimitiveContext | null {
        return this.getRuleContext(0, PrimitiveContext);
    }
    public list(): ListContext | null {
        return this.getRuleContext(0, ListContext);
    }
    public ref(): RefContext | null {
        return this.getRuleContext(0, RefContext);
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
    public HASH(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.HASH, 0);
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
    public primitive(): PrimitiveContext[];
    public primitive(i: number): PrimitiveContext | null;
    public primitive(i?: number): PrimitiveContext[] | PrimitiveContext | null {
        if (i === undefined) {
            return this.getRuleContexts(PrimitiveContext);
        }

        return this.getRuleContext(i, PrimitiveContext);
    }
    public ref(): RefContext[];
    public ref(i: number): RefContext | null;
    public ref(i?: number): RefContext[] | RefContext | null {
        if (i === undefined) {
            return this.getRuleContexts(RefContext);
        }

        return this.getRuleContext(i, RefContext);
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


export class PrimitiveContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public NAME(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.NAME, 0);
    }
    public NUMBER(): antlr.TerminalNode | null {
        return this.getToken(DSLParser.NUMBER, 0);
    }
    public override get ruleIndex(): number {
        return DSLParser.RULE_primitive;
    }
    public override enterRule(listener: DSLListener): void {
        if(listener.enterPrimitive) {
             listener.enterPrimitive(this);
        }
    }
    public override exitRule(listener: DSLListener): void {
        if(listener.exitPrimitive) {
             listener.exitPrimitive(this);
        }
    }
    public override accept<Result>(visitor: DSLVisitor<Result>): Result | null {
        if (visitor.visitPrimitive) {
            return visitor.visitPrimitive(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class RefContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
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
    public override get ruleIndex(): number {
        return DSLParser.RULE_ref;
    }
    public override enterRule(listener: DSLListener): void {
        if(listener.enterRef) {
             listener.enterRef(this);
        }
    }
    public override exitRule(listener: DSLListener): void {
        if(listener.exitRef) {
             listener.exitRef(this);
        }
    }
    public override accept<Result>(visitor: DSLVisitor<Result>): Result | null {
        if (visitor.visitRef) {
            return visitor.visitRef(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
