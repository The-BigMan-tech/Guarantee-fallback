
import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";


export class DSLLexer extends antlr.Lexer {
    public static readonly COMMA = 1;
    public static readonly COLON = 2;
    public static readonly LPAREN = 3;
    public static readonly RPAREN = 4;
    public static readonly LSQUARE = 5;
    public static readonly RSQUARE = 6;
    public static readonly SEMICOLON = 7;
    public static readonly QUESTION = 8;
    public static readonly EXCLAMATION = 9;
    public static readonly APOSTROPHE = 10;
    public static readonly EQUALS = 11;
    public static readonly ATOM = 12;
    public static readonly LET = 13;
    public static readonly TERMINATOR = 14;
    public static readonly PREDICATE = 15;
    public static readonly ALIAS = 16;
    public static readonly NAME = 17;
    public static readonly NUMBER = 18;
    public static readonly PLAIN_WORD = 19;
    public static readonly WS = 20;
    public static readonly COMMENT = 21;

    public static readonly channelNames = [
        "DEFAULT_TOKEN_CHANNEL", "HIDDEN"
    ];

    public static readonly literalNames = [
        null, "','", "':'", "'('", "')'", "'['", "']'", "';'", "'?'", "'!'", 
        "'''", "'='", null, "'let'", "'.'"
    ];

    public static readonly symbolicNames = [
        null, "COMMA", "COLON", "LPAREN", "RPAREN", "LSQUARE", "RSQUARE", 
        "SEMICOLON", "QUESTION", "EXCLAMATION", "APOSTROPHE", "EQUALS", 
        "ATOM", "LET", "TERMINATOR", "PREDICATE", "ALIAS", "NAME", "NUMBER", 
        "PLAIN_WORD", "WS", "COMMENT"
    ];

    public static readonly modeNames = [
        "DEFAULT_MODE",
    ];

    public static readonly ruleNames = [
        "LETTER", "DIGIT", "COMMA", "COLON", "LPAREN", "RPAREN", "LSQUARE", 
        "RSQUARE", "SEMICOLON", "QUESTION", "EXCLAMATION", "APOSTROPHE", 
        "EQUALS", "ATOM", "LET", "TERMINATOR", "PREDICATE", "ALIAS", "NAME", 
        "NUMBER", "PLAIN_WORD", "WS", "COMMENT",
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
        4,0,21,135,6,-1,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,
        2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,
        13,7,13,2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,
        19,2,20,7,20,2,21,7,21,2,22,7,22,1,0,1,0,1,1,1,1,1,2,1,2,1,3,1,3,
        1,4,1,4,1,5,1,5,1,6,1,6,1,7,1,7,1,8,1,8,1,9,1,9,1,10,1,10,1,11,1,
        11,1,12,1,12,1,13,1,13,3,13,76,8,13,1,14,1,14,1,14,1,14,1,15,1,15,
        1,16,1,16,1,16,1,17,1,17,1,17,1,18,1,18,1,18,1,19,3,19,94,8,19,1,
        19,4,19,97,8,19,11,19,12,19,98,1,19,1,19,4,19,103,8,19,11,19,12,
        19,104,3,19,107,8,19,1,20,1,20,1,20,1,20,5,20,113,8,20,10,20,12,
        20,116,9,20,1,21,4,21,119,8,21,11,21,12,21,120,1,21,1,21,1,22,1,
        22,1,22,1,22,5,22,129,8,22,10,22,12,22,132,9,22,1,22,1,22,0,0,23,
        1,0,3,0,5,1,7,2,9,3,11,4,13,5,15,6,17,7,19,8,21,9,23,10,25,11,27,
        12,29,13,31,14,33,15,35,16,37,17,39,18,41,19,43,20,45,21,1,0,4,2,
        0,65,90,97,122,1,0,48,57,3,0,9,10,13,13,32,32,2,0,10,10,13,13,142,
        0,5,1,0,0,0,0,7,1,0,0,0,0,9,1,0,0,0,0,11,1,0,0,0,0,13,1,0,0,0,0,
        15,1,0,0,0,0,17,1,0,0,0,0,19,1,0,0,0,0,21,1,0,0,0,0,23,1,0,0,0,0,
        25,1,0,0,0,0,27,1,0,0,0,0,29,1,0,0,0,0,31,1,0,0,0,0,33,1,0,0,0,0,
        35,1,0,0,0,0,37,1,0,0,0,0,39,1,0,0,0,0,41,1,0,0,0,0,43,1,0,0,0,0,
        45,1,0,0,0,1,47,1,0,0,0,3,49,1,0,0,0,5,51,1,0,0,0,7,53,1,0,0,0,9,
        55,1,0,0,0,11,57,1,0,0,0,13,59,1,0,0,0,15,61,1,0,0,0,17,63,1,0,0,
        0,19,65,1,0,0,0,21,67,1,0,0,0,23,69,1,0,0,0,25,71,1,0,0,0,27,75,
        1,0,0,0,29,77,1,0,0,0,31,81,1,0,0,0,33,83,1,0,0,0,35,86,1,0,0,0,
        37,89,1,0,0,0,39,93,1,0,0,0,41,108,1,0,0,0,43,118,1,0,0,0,45,124,
        1,0,0,0,47,48,7,0,0,0,48,2,1,0,0,0,49,50,7,1,0,0,50,4,1,0,0,0,51,
        52,5,44,0,0,52,6,1,0,0,0,53,54,5,58,0,0,54,8,1,0,0,0,55,56,5,40,
        0,0,56,10,1,0,0,0,57,58,5,41,0,0,58,12,1,0,0,0,59,60,5,91,0,0,60,
        14,1,0,0,0,61,62,5,93,0,0,62,16,1,0,0,0,63,64,5,59,0,0,64,18,1,0,
        0,0,65,66,5,63,0,0,66,20,1,0,0,0,67,68,5,33,0,0,68,22,1,0,0,0,69,
        70,5,39,0,0,70,24,1,0,0,0,71,72,5,61,0,0,72,26,1,0,0,0,73,76,3,37,
        18,0,74,76,3,39,19,0,75,73,1,0,0,0,75,74,1,0,0,0,76,28,1,0,0,0,77,
        78,5,108,0,0,78,79,5,101,0,0,79,80,5,116,0,0,80,30,1,0,0,0,81,82,
        5,46,0,0,82,32,1,0,0,0,83,84,5,42,0,0,84,85,3,41,20,0,85,34,1,0,
        0,0,86,87,5,35,0,0,87,88,3,41,20,0,88,36,1,0,0,0,89,90,5,58,0,0,
        90,91,3,41,20,0,91,38,1,0,0,0,92,94,5,45,0,0,93,92,1,0,0,0,93,94,
        1,0,0,0,94,96,1,0,0,0,95,97,3,3,1,0,96,95,1,0,0,0,97,98,1,0,0,0,
        98,96,1,0,0,0,98,99,1,0,0,0,99,106,1,0,0,0,100,102,5,46,0,0,101,
        103,3,3,1,0,102,101,1,0,0,0,103,104,1,0,0,0,104,102,1,0,0,0,104,
        105,1,0,0,0,105,107,1,0,0,0,106,100,1,0,0,0,106,107,1,0,0,0,107,
        40,1,0,0,0,108,114,3,1,0,0,109,113,3,1,0,0,110,113,3,3,1,0,111,113,
        5,95,0,0,112,109,1,0,0,0,112,110,1,0,0,0,112,111,1,0,0,0,113,116,
        1,0,0,0,114,112,1,0,0,0,114,115,1,0,0,0,115,42,1,0,0,0,116,114,1,
        0,0,0,117,119,7,2,0,0,118,117,1,0,0,0,119,120,1,0,0,0,120,118,1,
        0,0,0,120,121,1,0,0,0,121,122,1,0,0,0,122,123,6,21,0,0,123,44,1,
        0,0,0,124,125,5,47,0,0,125,126,5,47,0,0,126,130,1,0,0,0,127,129,
        8,3,0,0,128,127,1,0,0,0,129,132,1,0,0,0,130,128,1,0,0,0,130,131,
        1,0,0,0,131,133,1,0,0,0,132,130,1,0,0,0,133,134,6,22,0,0,134,46,
        1,0,0,0,10,0,75,93,98,104,106,112,114,120,130,1,6,0,0
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