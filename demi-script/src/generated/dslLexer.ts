
import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";


export class DSLLexer extends antlr.Lexer {
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

    public static readonly channelNames = [
        "DEFAULT_TOKEN_CHANNEL", "HIDDEN"
    ];

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

    public static readonly modeNames = [
        "DEFAULT_MODE",
    ];

    public static readonly ruleNames = [
        "LETTER", "DIGIT", "COMMA", "LPAREN", "RPAREN", "LSQUARE", "RSQUARE", 
        "SEMICOLON", "QUESTION", "EXCLAMATION", "APOSTROPHE", "EQUALS", 
        "LET", "TERMINATOR", "PERIOD", "PREDICATE", "ALIAS", "NAME", "NUMBER", 
        "PLAIN_WORD", "NEW_LINE", "WS", "COMMENT",
    ];


    public constructor(input: antlr.CharStream) {
        super(input);
        this.interpreter = new antlr.LexerATNSimulator(this, DSLLexer._ATN, DSLLexer.decisionsToDFA, new antlr.PredictionContextCache());
    }

    public get grammarFileName(): string { return "DSL.g4"; }

    public get literalNames(): (string | null)[] { return DSLLexer.literalNames; }
    public get symbolicNames(): (string | null)[] { return DSLLexer.symbolicNames; }
    public get ruleNames(): string[] { return DSLLexer.ruleNames; }

    public get serializedATN(): number[] { return DSLLexer._serializedATN; }

    public get channelNames(): string[] { return DSLLexer.channelNames; }

    public get modeNames(): string[] { return DSLLexer.modeNames; }

    public static readonly _serializedATN: number[] = [
        4,0,20,140,6,-1,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,
        2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,
        13,7,13,2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,
        19,2,20,7,20,2,21,7,21,2,22,7,22,1,0,1,0,1,1,1,1,1,2,1,2,1,3,1,3,
        1,4,1,4,1,5,1,5,1,6,1,6,1,7,1,7,1,8,1,8,1,9,1,9,1,10,1,10,1,11,1,
        11,1,12,1,12,1,12,1,12,1,13,1,13,1,13,1,13,3,13,80,8,13,1,14,1,14,
        1,15,1,15,1,15,1,16,1,16,1,16,1,17,1,17,1,17,1,18,3,18,94,8,18,1,
        18,4,18,97,8,18,11,18,12,18,98,1,18,1,18,4,18,103,8,18,11,18,12,
        18,104,3,18,107,8,18,1,19,1,19,1,19,1,19,5,19,113,8,19,10,19,12,
        19,116,9,19,1,20,1,20,1,20,3,20,121,8,20,1,21,4,21,124,8,21,11,21,
        12,21,125,1,21,1,21,1,22,1,22,1,22,1,22,5,22,134,8,22,10,22,12,22,
        137,9,22,1,22,1,22,0,0,23,1,0,3,0,5,1,7,2,9,3,11,4,13,5,15,6,17,
        7,19,8,21,9,23,10,25,11,27,12,29,0,31,13,33,14,35,15,37,16,39,17,
        41,18,43,19,45,20,1,0,4,2,0,65,90,97,122,1,0,48,57,2,0,10,10,13,
        13,2,0,9,9,32,32,147,0,5,1,0,0,0,0,7,1,0,0,0,0,9,1,0,0,0,0,11,1,
        0,0,0,0,13,1,0,0,0,0,15,1,0,0,0,0,17,1,0,0,0,0,19,1,0,0,0,0,21,1,
        0,0,0,0,23,1,0,0,0,0,25,1,0,0,0,0,27,1,0,0,0,0,31,1,0,0,0,0,33,1,
        0,0,0,0,35,1,0,0,0,0,37,1,0,0,0,0,39,1,0,0,0,0,41,1,0,0,0,0,43,1,
        0,0,0,0,45,1,0,0,0,1,47,1,0,0,0,3,49,1,0,0,0,5,51,1,0,0,0,7,53,1,
        0,0,0,9,55,1,0,0,0,11,57,1,0,0,0,13,59,1,0,0,0,15,61,1,0,0,0,17,
        63,1,0,0,0,19,65,1,0,0,0,21,67,1,0,0,0,23,69,1,0,0,0,25,71,1,0,0,
        0,27,79,1,0,0,0,29,81,1,0,0,0,31,83,1,0,0,0,33,86,1,0,0,0,35,89,
        1,0,0,0,37,93,1,0,0,0,39,108,1,0,0,0,41,120,1,0,0,0,43,123,1,0,0,
        0,45,129,1,0,0,0,47,48,7,0,0,0,48,2,1,0,0,0,49,50,7,1,0,0,50,4,1,
        0,0,0,51,52,5,44,0,0,52,6,1,0,0,0,53,54,5,40,0,0,54,8,1,0,0,0,55,
        56,5,41,0,0,56,10,1,0,0,0,57,58,5,91,0,0,58,12,1,0,0,0,59,60,5,93,
        0,0,60,14,1,0,0,0,61,62,5,59,0,0,62,16,1,0,0,0,63,64,5,63,0,0,64,
        18,1,0,0,0,65,66,5,33,0,0,66,20,1,0,0,0,67,68,5,39,0,0,68,22,1,0,
        0,0,69,70,5,61,0,0,70,24,1,0,0,0,71,72,5,108,0,0,72,73,5,101,0,0,
        73,74,5,116,0,0,74,26,1,0,0,0,75,80,3,29,14,0,76,77,3,29,14,0,77,
        78,3,41,20,0,78,80,1,0,0,0,79,75,1,0,0,0,79,76,1,0,0,0,80,28,1,0,
        0,0,81,82,5,46,0,0,82,30,1,0,0,0,83,84,5,42,0,0,84,85,3,39,19,0,
        85,32,1,0,0,0,86,87,5,35,0,0,87,88,3,39,19,0,88,34,1,0,0,0,89,90,
        5,58,0,0,90,91,3,39,19,0,91,36,1,0,0,0,92,94,5,45,0,0,93,92,1,0,
        0,0,93,94,1,0,0,0,94,96,1,0,0,0,95,97,3,3,1,0,96,95,1,0,0,0,97,98,
        1,0,0,0,98,96,1,0,0,0,98,99,1,0,0,0,99,106,1,0,0,0,100,102,5,46,
        0,0,101,103,3,3,1,0,102,101,1,0,0,0,103,104,1,0,0,0,104,102,1,0,
        0,0,104,105,1,0,0,0,105,107,1,0,0,0,106,100,1,0,0,0,106,107,1,0,
        0,0,107,38,1,0,0,0,108,114,3,1,0,0,109,113,3,1,0,0,110,113,3,3,1,
        0,111,113,5,95,0,0,112,109,1,0,0,0,112,110,1,0,0,0,112,111,1,0,0,
        0,113,116,1,0,0,0,114,112,1,0,0,0,114,115,1,0,0,0,115,40,1,0,0,0,
        116,114,1,0,0,0,117,118,5,13,0,0,118,121,5,10,0,0,119,121,7,2,0,
        0,120,117,1,0,0,0,120,119,1,0,0,0,121,42,1,0,0,0,122,124,7,3,0,0,
        123,122,1,0,0,0,124,125,1,0,0,0,125,123,1,0,0,0,125,126,1,0,0,0,
        126,127,1,0,0,0,127,128,6,21,0,0,128,44,1,0,0,0,129,130,5,47,0,0,
        130,131,5,47,0,0,131,135,1,0,0,0,132,134,8,2,0,0,133,132,1,0,0,0,
        134,137,1,0,0,0,135,133,1,0,0,0,135,136,1,0,0,0,136,138,1,0,0,0,
        137,135,1,0,0,0,138,139,6,22,0,0,139,46,1,0,0,0,11,0,79,93,98,104,
        106,112,114,120,125,135,1,6,0,0
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!DSLLexer.__ATN) {
            DSLLexer.__ATN = new antlr.ATNDeserializer().deserialize(DSLLexer._serializedATN);
        }

        return DSLLexer.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(DSLLexer.literalNames, DSLLexer.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return DSLLexer.vocabulary;
    }

    private static readonly decisionsToDFA = DSLLexer._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}