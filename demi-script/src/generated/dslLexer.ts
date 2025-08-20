
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
    public static readonly SINGLE_OBJECT_REF = 20;
    public static readonly GROUP_OBJECT_REF = 21;
    public static readonly NEW_LINE = 22;
    public static readonly WS = 23;
    public static readonly COMMENT = 24;

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
        "GROUP_SUBJECT_REF", "SINGLE_OBJECT_REF", "GROUP_OBJECT_REF", "NEW_LINE", 
        "WS", "COMMENT"
    ];

    public static readonly modeNames = [
        "DEFAULT_MODE",
    ];

    public static readonly ruleNames = [
        "LETTER", "DIGIT", "COMMA", "LPAREN", "RPAREN", "LSQUARE", "RSQUARE", 
        "SEMICOLON", "QUESTION", "EXCLAMATION", "APOSTROPHE", "EQUALS", 
        "ALIAS_KW", "TERMINATOR", "PERIOD", "PREDICATE", "ALIAS", "NAME", 
        "NUMBER", "PLAIN_WORD", "SINGLE_SUBJECT_REF", "GROUP_SUBJECT_REF", 
        "SINGLE_OBJECT_REF", "GROUP_OBJECT_REF", "SINGLE_NOUN_OBJECT_REF", 
        "GROUP_NOUN_OBJECT_REF", "SINGLE_NOUN_REF", "GROUP_NOUN_REF", "NEW_LINE", 
        "WS", "COMMENT",
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
        4,0,24,206,6,-1,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,
        2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,
        13,7,13,2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,
        19,2,20,7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,
        26,7,26,2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,1,0,1,0,1,1,1,1,
        1,2,1,2,1,3,1,3,1,4,1,4,1,5,1,5,1,6,1,6,1,7,1,7,1,8,1,8,1,9,1,9,
        1,10,1,10,1,11,1,11,1,12,1,12,1,12,1,12,1,12,1,12,1,13,1,13,1,13,
        1,13,3,13,98,8,13,1,14,1,14,1,15,1,15,1,15,1,16,1,16,1,16,1,17,1,
        17,1,17,1,17,3,17,112,8,17,1,18,3,18,115,8,18,1,18,4,18,118,8,18,
        11,18,12,18,119,1,18,1,18,4,18,124,8,18,11,18,12,18,125,3,18,128,
        8,18,1,19,1,19,1,19,1,19,5,19,134,8,19,10,19,12,19,137,9,19,1,20,
        1,20,1,20,1,20,1,21,1,21,1,21,1,21,1,22,1,22,1,22,1,22,1,23,1,23,
        1,23,1,23,1,24,1,24,1,24,1,24,1,24,1,24,1,24,1,24,3,24,163,8,24,
        1,25,1,25,1,25,1,25,1,25,1,26,1,26,1,26,1,26,1,26,1,26,1,26,3,26,
        177,8,26,1,27,1,27,1,27,1,27,1,27,1,28,1,28,1,28,3,28,187,8,28,1,
        29,4,29,190,8,29,11,29,12,29,191,1,29,1,29,1,30,1,30,1,30,1,30,5,
        30,200,8,30,10,30,12,30,203,9,30,1,30,1,30,0,0,31,1,0,3,0,5,1,7,
        2,9,3,11,4,13,5,15,6,17,7,19,8,21,9,23,10,25,11,27,12,29,0,31,13,
        33,14,35,15,37,16,39,17,41,18,43,19,45,20,47,21,49,0,51,0,53,0,55,
        0,57,22,59,23,61,24,1,0,4,2,0,65,90,97,122,1,0,48,57,2,0,10,10,13,
        13,2,0,9,9,32,32,214,0,5,1,0,0,0,0,7,1,0,0,0,0,9,1,0,0,0,0,11,1,
        0,0,0,0,13,1,0,0,0,0,15,1,0,0,0,0,17,1,0,0,0,0,19,1,0,0,0,0,21,1,
        0,0,0,0,23,1,0,0,0,0,25,1,0,0,0,0,27,1,0,0,0,0,31,1,0,0,0,0,33,1,
        0,0,0,0,35,1,0,0,0,0,37,1,0,0,0,0,39,1,0,0,0,0,41,1,0,0,0,0,43,1,
        0,0,0,0,45,1,0,0,0,0,47,1,0,0,0,0,57,1,0,0,0,0,59,1,0,0,0,0,61,1,
        0,0,0,1,63,1,0,0,0,3,65,1,0,0,0,5,67,1,0,0,0,7,69,1,0,0,0,9,71,1,
        0,0,0,11,73,1,0,0,0,13,75,1,0,0,0,15,77,1,0,0,0,17,79,1,0,0,0,19,
        81,1,0,0,0,21,83,1,0,0,0,23,85,1,0,0,0,25,87,1,0,0,0,27,97,1,0,0,
        0,29,99,1,0,0,0,31,101,1,0,0,0,33,104,1,0,0,0,35,111,1,0,0,0,37,
        114,1,0,0,0,39,129,1,0,0,0,41,138,1,0,0,0,43,142,1,0,0,0,45,146,
        1,0,0,0,47,150,1,0,0,0,49,162,1,0,0,0,51,164,1,0,0,0,53,176,1,0,
        0,0,55,178,1,0,0,0,57,186,1,0,0,0,59,189,1,0,0,0,61,195,1,0,0,0,
        63,64,7,0,0,0,64,2,1,0,0,0,65,66,7,1,0,0,66,4,1,0,0,0,67,68,5,44,
        0,0,68,6,1,0,0,0,69,70,5,40,0,0,70,8,1,0,0,0,71,72,5,41,0,0,72,10,
        1,0,0,0,73,74,5,91,0,0,74,12,1,0,0,0,75,76,5,93,0,0,76,14,1,0,0,
        0,77,78,5,59,0,0,78,16,1,0,0,0,79,80,5,63,0,0,80,18,1,0,0,0,81,82,
        5,33,0,0,82,20,1,0,0,0,83,84,5,39,0,0,84,22,1,0,0,0,85,86,5,61,0,
        0,86,24,1,0,0,0,87,88,5,97,0,0,88,89,5,108,0,0,89,90,5,105,0,0,90,
        91,5,97,0,0,91,92,5,115,0,0,92,26,1,0,0,0,93,98,3,29,14,0,94,95,
        3,29,14,0,95,96,3,57,28,0,96,98,1,0,0,0,97,93,1,0,0,0,97,94,1,0,
        0,0,98,28,1,0,0,0,99,100,5,46,0,0,100,30,1,0,0,0,101,102,5,42,0,
        0,102,103,3,39,19,0,103,32,1,0,0,0,104,105,5,35,0,0,105,106,3,39,
        19,0,106,34,1,0,0,0,107,108,5,58,0,0,108,112,3,39,19,0,109,110,5,
        33,0,0,110,112,3,39,19,0,111,107,1,0,0,0,111,109,1,0,0,0,112,36,
        1,0,0,0,113,115,5,45,0,0,114,113,1,0,0,0,114,115,1,0,0,0,115,117,
        1,0,0,0,116,118,3,3,1,0,117,116,1,0,0,0,118,119,1,0,0,0,119,117,
        1,0,0,0,119,120,1,0,0,0,120,127,1,0,0,0,121,123,5,46,0,0,122,124,
        3,3,1,0,123,122,1,0,0,0,124,125,1,0,0,0,125,123,1,0,0,0,125,126,
        1,0,0,0,126,128,1,0,0,0,127,121,1,0,0,0,127,128,1,0,0,0,128,38,1,
        0,0,0,129,135,3,1,0,0,130,134,3,1,0,0,131,134,3,3,1,0,132,134,5,
        95,0,0,133,130,1,0,0,0,133,131,1,0,0,0,133,132,1,0,0,0,134,137,1,
        0,0,0,135,133,1,0,0,0,135,136,1,0,0,0,136,40,1,0,0,0,137,135,1,0,
        0,0,138,139,5,60,0,0,139,140,3,53,26,0,140,141,5,62,0,0,141,42,1,
        0,0,0,142,143,5,60,0,0,143,144,3,55,27,0,144,145,5,62,0,0,145,44,
        1,0,0,0,146,147,5,60,0,0,147,148,3,49,24,0,148,149,5,62,0,0,149,
        46,1,0,0,0,150,151,5,60,0,0,151,152,3,51,25,0,152,153,5,62,0,0,153,
        48,1,0,0,0,154,155,5,104,0,0,155,156,5,105,0,0,156,163,5,109,0,0,
        157,158,5,104,0,0,158,159,5,101,0,0,159,163,5,114,0,0,160,161,5,
        105,0,0,161,163,5,116,0,0,162,154,1,0,0,0,162,157,1,0,0,0,162,160,
        1,0,0,0,163,50,1,0,0,0,164,165,5,116,0,0,165,166,5,104,0,0,166,167,
        5,101,0,0,167,168,5,109,0,0,168,52,1,0,0,0,169,170,5,72,0,0,170,
        177,5,101,0,0,171,172,5,83,0,0,172,173,5,104,0,0,173,177,5,101,0,
        0,174,175,5,73,0,0,175,177,5,116,0,0,176,169,1,0,0,0,176,171,1,0,
        0,0,176,174,1,0,0,0,177,54,1,0,0,0,178,179,5,84,0,0,179,180,5,104,
        0,0,180,181,5,101,0,0,181,182,5,121,0,0,182,56,1,0,0,0,183,184,5,
        13,0,0,184,187,5,10,0,0,185,187,7,2,0,0,186,183,1,0,0,0,186,185,
        1,0,0,0,187,58,1,0,0,0,188,190,7,3,0,0,189,188,1,0,0,0,190,191,1,
        0,0,0,191,189,1,0,0,0,191,192,1,0,0,0,192,193,1,0,0,0,193,194,6,
        29,0,0,194,60,1,0,0,0,195,196,5,47,0,0,196,197,5,47,0,0,197,201,
        1,0,0,0,198,200,8,2,0,0,199,198,1,0,0,0,200,203,1,0,0,0,201,199,
        1,0,0,0,201,202,1,0,0,0,202,204,1,0,0,0,203,201,1,0,0,0,204,205,
        6,30,0,0,205,62,1,0,0,0,14,0,97,111,114,119,125,127,133,135,162,
        176,186,191,201,1,6,0,0
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