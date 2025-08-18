
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
    public static readonly LET = 12;
    public static readonly TERMINATOR = 13;
    public static readonly PREDICATE = 14;
    public static readonly ALIAS = 15;
    public static readonly NAME = 16;
    public static readonly NUMBER = 17;
    public static readonly PLAIN_WORD = 18;
    public static readonly WS = 19;
    public static readonly COMMENT = 20;

    public static readonly channelNames = [
        "DEFAULT_TOKEN_CHANNEL", "HIDDEN"
    ];

    public static readonly literalNames = [
        null, "','", "':'", "'('", "')'", "'['", "']'", "';'", "'?'", "'!'", 
        "'''", "'='", "'let'", "'.'"
    ];

    public static readonly symbolicNames = [
        null, "COMMA", "COLON", "LPAREN", "RPAREN", "LSQUARE", "RSQUARE", 
        "SEMICOLON", "QUESTION", "EXCLAMATION", "APOSTROPHE", "EQUALS", 
        "LET", "TERMINATOR", "PREDICATE", "ALIAS", "NAME", "NUMBER", "PLAIN_WORD", 
        "WS", "COMMENT"
    ];

    public static readonly modeNames = [
        "DEFAULT_MODE",
    ];

    public static readonly ruleNames = [
        "LETTER", "DIGIT", "COMMA", "COLON", "LPAREN", "RPAREN", "LSQUARE", 
        "RSQUARE", "SEMICOLON", "QUESTION", "EXCLAMATION", "APOSTROPHE", 
        "EQUALS", "LET", "TERMINATOR", "PREDICATE", "ALIAS", "NAME", "NUMBER", 
        "PLAIN_WORD", "WS", "COMMENT",
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
        4,0,20,129,6,-1,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,
        2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,
        13,7,13,2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,
        19,2,20,7,20,2,21,7,21,1,0,1,0,1,1,1,1,1,2,1,2,1,3,1,3,1,4,1,4,1,
        5,1,5,1,6,1,6,1,7,1,7,1,8,1,8,1,9,1,9,1,10,1,10,1,11,1,11,1,12,1,
        12,1,13,1,13,1,13,1,13,1,14,1,14,1,15,1,15,1,15,1,16,1,16,1,16,1,
        17,1,17,1,17,1,18,3,18,88,8,18,1,18,4,18,91,8,18,11,18,12,18,92,
        1,18,1,18,4,18,97,8,18,11,18,12,18,98,3,18,101,8,18,1,19,1,19,1,
        19,1,19,5,19,107,8,19,10,19,12,19,110,9,19,1,20,4,20,113,8,20,11,
        20,12,20,114,1,20,1,20,1,21,1,21,1,21,1,21,5,21,123,8,21,10,21,12,
        21,126,9,21,1,21,1,21,0,0,22,1,0,3,0,5,1,7,2,9,3,11,4,13,5,15,6,
        17,7,19,8,21,9,23,10,25,11,27,12,29,13,31,14,33,15,35,16,37,17,39,
        18,41,19,43,20,1,0,4,2,0,65,90,97,122,1,0,48,57,3,0,9,10,13,13,32,
        32,2,0,10,10,13,13,135,0,5,1,0,0,0,0,7,1,0,0,0,0,9,1,0,0,0,0,11,
        1,0,0,0,0,13,1,0,0,0,0,15,1,0,0,0,0,17,1,0,0,0,0,19,1,0,0,0,0,21,
        1,0,0,0,0,23,1,0,0,0,0,25,1,0,0,0,0,27,1,0,0,0,0,29,1,0,0,0,0,31,
        1,0,0,0,0,33,1,0,0,0,0,35,1,0,0,0,0,37,1,0,0,0,0,39,1,0,0,0,0,41,
        1,0,0,0,0,43,1,0,0,0,1,45,1,0,0,0,3,47,1,0,0,0,5,49,1,0,0,0,7,51,
        1,0,0,0,9,53,1,0,0,0,11,55,1,0,0,0,13,57,1,0,0,0,15,59,1,0,0,0,17,
        61,1,0,0,0,19,63,1,0,0,0,21,65,1,0,0,0,23,67,1,0,0,0,25,69,1,0,0,
        0,27,71,1,0,0,0,29,75,1,0,0,0,31,77,1,0,0,0,33,80,1,0,0,0,35,83,
        1,0,0,0,37,87,1,0,0,0,39,102,1,0,0,0,41,112,1,0,0,0,43,118,1,0,0,
        0,45,46,7,0,0,0,46,2,1,0,0,0,47,48,7,1,0,0,48,4,1,0,0,0,49,50,5,
        44,0,0,50,6,1,0,0,0,51,52,5,58,0,0,52,8,1,0,0,0,53,54,5,40,0,0,54,
        10,1,0,0,0,55,56,5,41,0,0,56,12,1,0,0,0,57,58,5,91,0,0,58,14,1,0,
        0,0,59,60,5,93,0,0,60,16,1,0,0,0,61,62,5,59,0,0,62,18,1,0,0,0,63,
        64,5,63,0,0,64,20,1,0,0,0,65,66,5,33,0,0,66,22,1,0,0,0,67,68,5,39,
        0,0,68,24,1,0,0,0,69,70,5,61,0,0,70,26,1,0,0,0,71,72,5,108,0,0,72,
        73,5,101,0,0,73,74,5,116,0,0,74,28,1,0,0,0,75,76,5,46,0,0,76,30,
        1,0,0,0,77,78,5,42,0,0,78,79,3,39,19,0,79,32,1,0,0,0,80,81,5,35,
        0,0,81,82,3,39,19,0,82,34,1,0,0,0,83,84,5,58,0,0,84,85,3,39,19,0,
        85,36,1,0,0,0,86,88,5,45,0,0,87,86,1,0,0,0,87,88,1,0,0,0,88,90,1,
        0,0,0,89,91,3,3,1,0,90,89,1,0,0,0,91,92,1,0,0,0,92,90,1,0,0,0,92,
        93,1,0,0,0,93,100,1,0,0,0,94,96,5,46,0,0,95,97,3,3,1,0,96,95,1,0,
        0,0,97,98,1,0,0,0,98,96,1,0,0,0,98,99,1,0,0,0,99,101,1,0,0,0,100,
        94,1,0,0,0,100,101,1,0,0,0,101,38,1,0,0,0,102,108,3,1,0,0,103,107,
        3,1,0,0,104,107,3,3,1,0,105,107,5,95,0,0,106,103,1,0,0,0,106,104,
        1,0,0,0,106,105,1,0,0,0,107,110,1,0,0,0,108,106,1,0,0,0,108,109,
        1,0,0,0,109,40,1,0,0,0,110,108,1,0,0,0,111,113,7,2,0,0,112,111,1,
        0,0,0,113,114,1,0,0,0,114,112,1,0,0,0,114,115,1,0,0,0,115,116,1,
        0,0,0,116,117,6,20,0,0,117,42,1,0,0,0,118,119,5,47,0,0,119,120,5,
        47,0,0,120,124,1,0,0,0,121,123,8,3,0,0,122,121,1,0,0,0,123,126,1,
        0,0,0,124,122,1,0,0,0,124,125,1,0,0,0,125,127,1,0,0,0,126,124,1,
        0,0,0,127,128,6,21,0,0,128,44,1,0,0,0,9,0,87,92,98,100,106,108,114,
        124,1,6,0,0
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