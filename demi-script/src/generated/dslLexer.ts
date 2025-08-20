
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
    public static readonly ALIAS_KW = 11;
    public static readonly TERMINATOR = 12;
    public static readonly PREDICATE = 13;
    public static readonly ALIAS = 14;
    public static readonly NAME = 15;
    public static readonly NUMBER = 16;
    public static readonly PLAIN_WORD = 17;
    public static readonly SINGLE_SUBJECT_REF = 18;
    public static readonly GROUP_SUBJECT_REF = 19;
    public static readonly NEW_LINE = 20;
    public static readonly WS = 21;
    public static readonly COMMENT = 22;

    public static readonly channelNames = [
        "DEFAULT_TOKEN_CHANNEL", "HIDDEN"
    ];

    public static readonly literalNames = [
        null, "','", "'('", "')'", "'['", "']'", "';'", "'?'", "'!'", "'''", 
        "'='", "'alias'"
    ];

    public static readonly symbolicNames = [
        null, "COMMA", "LPAREN", "RPAREN", "LSQUARE", "RSQUARE", "SEMICOLON", 
        "QUESTION", "EXCLAMATION", "APOSTROPHE", "EQUALS", "ALIAS_KW", "TERMINATOR", 
        "PREDICATE", "ALIAS", "NAME", "NUMBER", "PLAIN_WORD", "SINGLE_SUBJECT_REF", 
        "GROUP_SUBJECT_REF", "NEW_LINE", "WS", "COMMENT"
    ];

    public static readonly modeNames = [
        "DEFAULT_MODE",
    ];

    public static readonly ruleNames = [
        "LETTER", "DIGIT", "COMMA", "LPAREN", "RPAREN", "LSQUARE", "RSQUARE", 
        "SEMICOLON", "QUESTION", "EXCLAMATION", "APOSTROPHE", "EQUALS", 
        "ALIAS_KW", "TERMINATOR", "PERIOD", "PREDICATE", "ALIAS", "NAME", 
        "NUMBER", "PLAIN_WORD", "SINGLE_SUBJECT_REF", "GROUP_SUBJECT_REF", 
        "SINGLE_NOUN_REF", "GROUP_NOUN_REF", "NEW_LINE", "WS", "COMMENT",
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
        4,0,22,172,6,-1,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,
        2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,
        13,7,13,2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,
        19,2,20,7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,
        26,7,26,1,0,1,0,1,1,1,1,1,2,1,2,1,3,1,3,1,4,1,4,1,5,1,5,1,6,1,6,
        1,7,1,7,1,8,1,8,1,9,1,9,1,10,1,10,1,11,1,11,1,12,1,12,1,12,1,12,
        1,12,1,12,1,13,1,13,1,13,1,13,3,13,90,8,13,1,14,1,14,1,15,1,15,1,
        15,1,16,1,16,1,16,1,17,1,17,1,17,1,18,3,18,104,8,18,1,18,4,18,107,
        8,18,11,18,12,18,108,1,18,1,18,4,18,113,8,18,11,18,12,18,114,3,18,
        117,8,18,1,19,1,19,1,19,1,19,5,19,123,8,19,10,19,12,19,126,9,19,
        1,20,1,20,1,20,1,20,1,21,1,21,1,21,1,21,1,22,1,22,1,22,1,22,1,22,
        1,22,1,22,3,22,143,8,22,1,23,1,23,1,23,1,23,1,23,1,24,1,24,1,24,
        3,24,153,8,24,1,25,4,25,156,8,25,11,25,12,25,157,1,25,1,25,1,26,
        1,26,1,26,1,26,5,26,166,8,26,10,26,12,26,169,9,26,1,26,1,26,0,0,
        27,1,0,3,0,5,1,7,2,9,3,11,4,13,5,15,6,17,7,19,8,21,9,23,10,25,11,
        27,12,29,0,31,13,33,14,35,15,37,16,39,17,41,18,43,19,45,0,47,0,49,
        20,51,21,53,22,1,0,4,2,0,65,90,97,122,1,0,48,57,2,0,10,10,13,13,
        2,0,9,9,32,32,179,0,5,1,0,0,0,0,7,1,0,0,0,0,9,1,0,0,0,0,11,1,0,0,
        0,0,13,1,0,0,0,0,15,1,0,0,0,0,17,1,0,0,0,0,19,1,0,0,0,0,21,1,0,0,
        0,0,23,1,0,0,0,0,25,1,0,0,0,0,27,1,0,0,0,0,31,1,0,0,0,0,33,1,0,0,
        0,0,35,1,0,0,0,0,37,1,0,0,0,0,39,1,0,0,0,0,41,1,0,0,0,0,43,1,0,0,
        0,0,49,1,0,0,0,0,51,1,0,0,0,0,53,1,0,0,0,1,55,1,0,0,0,3,57,1,0,0,
        0,5,59,1,0,0,0,7,61,1,0,0,0,9,63,1,0,0,0,11,65,1,0,0,0,13,67,1,0,
        0,0,15,69,1,0,0,0,17,71,1,0,0,0,19,73,1,0,0,0,21,75,1,0,0,0,23,77,
        1,0,0,0,25,79,1,0,0,0,27,89,1,0,0,0,29,91,1,0,0,0,31,93,1,0,0,0,
        33,96,1,0,0,0,35,99,1,0,0,0,37,103,1,0,0,0,39,118,1,0,0,0,41,127,
        1,0,0,0,43,131,1,0,0,0,45,142,1,0,0,0,47,144,1,0,0,0,49,152,1,0,
        0,0,51,155,1,0,0,0,53,161,1,0,0,0,55,56,7,0,0,0,56,2,1,0,0,0,57,
        58,7,1,0,0,58,4,1,0,0,0,59,60,5,44,0,0,60,6,1,0,0,0,61,62,5,40,0,
        0,62,8,1,0,0,0,63,64,5,41,0,0,64,10,1,0,0,0,65,66,5,91,0,0,66,12,
        1,0,0,0,67,68,5,93,0,0,68,14,1,0,0,0,69,70,5,59,0,0,70,16,1,0,0,
        0,71,72,5,63,0,0,72,18,1,0,0,0,73,74,5,33,0,0,74,20,1,0,0,0,75,76,
        5,39,0,0,76,22,1,0,0,0,77,78,5,61,0,0,78,24,1,0,0,0,79,80,5,97,0,
        0,80,81,5,108,0,0,81,82,5,105,0,0,82,83,5,97,0,0,83,84,5,115,0,0,
        84,26,1,0,0,0,85,90,3,29,14,0,86,87,3,29,14,0,87,88,3,49,24,0,88,
        90,1,0,0,0,89,85,1,0,0,0,89,86,1,0,0,0,90,28,1,0,0,0,91,92,5,46,
        0,0,92,30,1,0,0,0,93,94,5,42,0,0,94,95,3,39,19,0,95,32,1,0,0,0,96,
        97,5,35,0,0,97,98,3,39,19,0,98,34,1,0,0,0,99,100,5,58,0,0,100,101,
        3,39,19,0,101,36,1,0,0,0,102,104,5,45,0,0,103,102,1,0,0,0,103,104,
        1,0,0,0,104,106,1,0,0,0,105,107,3,3,1,0,106,105,1,0,0,0,107,108,
        1,0,0,0,108,106,1,0,0,0,108,109,1,0,0,0,109,116,1,0,0,0,110,112,
        5,46,0,0,111,113,3,3,1,0,112,111,1,0,0,0,113,114,1,0,0,0,114,112,
        1,0,0,0,114,115,1,0,0,0,115,117,1,0,0,0,116,110,1,0,0,0,116,117,
        1,0,0,0,117,38,1,0,0,0,118,124,3,1,0,0,119,123,3,1,0,0,120,123,3,
        3,1,0,121,123,5,95,0,0,122,119,1,0,0,0,122,120,1,0,0,0,122,121,1,
        0,0,0,123,126,1,0,0,0,124,122,1,0,0,0,124,125,1,0,0,0,125,40,1,0,
        0,0,126,124,1,0,0,0,127,128,5,60,0,0,128,129,3,45,22,0,129,130,5,
        62,0,0,130,42,1,0,0,0,131,132,5,60,0,0,132,133,3,47,23,0,133,134,
        5,62,0,0,134,44,1,0,0,0,135,136,5,72,0,0,136,143,5,101,0,0,137,138,
        5,83,0,0,138,139,5,104,0,0,139,143,5,101,0,0,140,141,5,73,0,0,141,
        143,5,116,0,0,142,135,1,0,0,0,142,137,1,0,0,0,142,140,1,0,0,0,143,
        46,1,0,0,0,144,145,5,84,0,0,145,146,5,104,0,0,146,147,5,101,0,0,
        147,148,5,121,0,0,148,48,1,0,0,0,149,150,5,13,0,0,150,153,5,10,0,
        0,151,153,7,2,0,0,152,149,1,0,0,0,152,151,1,0,0,0,153,50,1,0,0,0,
        154,156,7,3,0,0,155,154,1,0,0,0,156,157,1,0,0,0,157,155,1,0,0,0,
        157,158,1,0,0,0,158,159,1,0,0,0,159,160,6,25,0,0,160,52,1,0,0,0,
        161,162,5,47,0,0,162,163,5,47,0,0,163,167,1,0,0,0,164,166,8,2,0,
        0,165,164,1,0,0,0,166,169,1,0,0,0,167,165,1,0,0,0,167,168,1,0,0,
        0,168,170,1,0,0,0,169,167,1,0,0,0,170,171,6,26,0,0,171,54,1,0,0,
        0,12,0,89,103,108,114,116,122,124,142,152,157,167,1,6,0,0
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