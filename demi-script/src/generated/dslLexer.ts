
import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";


export class DSLLexer extends antlr.Lexer {
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

    public static readonly channelNames = [
        "DEFAULT_TOKEN_CHANNEL", "HIDDEN"
    ];

    public static readonly literalNames = [
        null, "'='", "'let'", null, null, null, null, null, null, null, 
        "'.'"
    ];

    public static readonly symbolicNames = [
        null, null, "LET", "ATOM", "PREDICATE", "ALIAS", "STRING_LITERAL", 
        "NUMBER", "FILLER", "IDENTIFIER", "TERMINATOR", "WS", "COMMENT"
    ];

    public static readonly modeNames = [
        "DEFAULT_MODE",
    ];

    public static readonly ruleNames = [
        "T__0", "LETTER", "DIGIT", "LIST", "LET", "ATOM", "PREDICATE", "ALIAS", 
        "STRING_LITERAL", "NUMBER", "FILLER", "IDENTIFIER", "TERMINATOR", 
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
        4,0,12,133,6,-1,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,
        2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,
        13,7,13,2,14,7,14,1,0,1,0,1,1,1,1,1,2,1,2,1,3,1,3,1,3,1,3,5,3,42,
        8,3,10,3,12,3,45,9,3,3,3,47,8,3,1,3,1,3,1,4,1,4,1,4,1,4,1,5,1,5,
        1,5,3,5,58,8,5,1,6,1,6,1,6,1,7,1,7,1,7,1,8,1,8,1,8,1,8,5,8,70,8,
        8,10,8,12,8,73,9,8,1,8,1,8,1,9,3,9,78,8,9,1,9,4,9,81,8,9,11,9,12,
        9,82,1,9,1,9,4,9,87,8,9,11,9,12,9,88,3,9,91,8,9,1,10,1,10,3,10,95,
        8,10,1,10,1,10,1,10,5,10,100,8,10,10,10,12,10,103,9,10,1,11,1,11,
        1,11,1,11,5,11,109,8,11,10,11,12,11,112,9,11,1,12,1,12,1,13,4,13,
        117,8,13,11,13,12,13,118,1,13,1,13,1,14,1,14,1,14,1,14,5,14,127,
        8,14,10,14,12,14,130,9,14,1,14,1,14,0,0,15,1,1,3,0,5,0,7,0,9,2,11,
        3,13,4,15,5,17,6,19,7,21,8,23,9,25,10,27,11,29,12,1,0,5,2,0,65,90,
        97,122,1,0,48,57,2,0,39,39,92,92,3,0,9,10,13,13,32,32,2,0,10,10,
        13,13,148,0,1,1,0,0,0,0,9,1,0,0,0,0,11,1,0,0,0,0,13,1,0,0,0,0,15,
        1,0,0,0,0,17,1,0,0,0,0,19,1,0,0,0,0,21,1,0,0,0,0,23,1,0,0,0,0,25,
        1,0,0,0,0,27,1,0,0,0,0,29,1,0,0,0,1,31,1,0,0,0,3,33,1,0,0,0,5,35,
        1,0,0,0,7,37,1,0,0,0,9,50,1,0,0,0,11,57,1,0,0,0,13,59,1,0,0,0,15,
        62,1,0,0,0,17,65,1,0,0,0,19,77,1,0,0,0,21,94,1,0,0,0,23,104,1,0,
        0,0,25,113,1,0,0,0,27,116,1,0,0,0,29,122,1,0,0,0,31,32,5,61,0,0,
        32,2,1,0,0,0,33,34,7,0,0,0,34,4,1,0,0,0,35,36,7,1,0,0,36,6,1,0,0,
        0,37,46,5,91,0,0,38,43,3,11,5,0,39,40,5,44,0,0,40,42,3,11,5,0,41,
        39,1,0,0,0,42,45,1,0,0,0,43,41,1,0,0,0,43,44,1,0,0,0,44,47,1,0,0,
        0,45,43,1,0,0,0,46,38,1,0,0,0,46,47,1,0,0,0,47,48,1,0,0,0,48,49,
        5,93,0,0,49,8,1,0,0,0,50,51,5,108,0,0,51,52,5,101,0,0,52,53,5,116,
        0,0,53,10,1,0,0,0,54,58,3,17,8,0,55,58,3,19,9,0,56,58,3,7,3,0,57,
        54,1,0,0,0,57,55,1,0,0,0,57,56,1,0,0,0,58,12,1,0,0,0,59,60,5,42,
        0,0,60,61,3,23,11,0,61,14,1,0,0,0,62,63,5,35,0,0,63,64,3,23,11,0,
        64,16,1,0,0,0,65,71,5,39,0,0,66,70,8,2,0,0,67,68,5,92,0,0,68,70,
        9,0,0,0,69,66,1,0,0,0,69,67,1,0,0,0,70,73,1,0,0,0,71,69,1,0,0,0,
        71,72,1,0,0,0,72,74,1,0,0,0,73,71,1,0,0,0,74,75,5,39,0,0,75,18,1,
        0,0,0,76,78,5,45,0,0,77,76,1,0,0,0,77,78,1,0,0,0,78,80,1,0,0,0,79,
        81,3,5,2,0,80,79,1,0,0,0,81,82,1,0,0,0,82,80,1,0,0,0,82,83,1,0,0,
        0,83,90,1,0,0,0,84,86,5,46,0,0,85,87,3,5,2,0,86,85,1,0,0,0,87,88,
        1,0,0,0,88,86,1,0,0,0,88,89,1,0,0,0,89,91,1,0,0,0,90,84,1,0,0,0,
        90,91,1,0,0,0,91,20,1,0,0,0,92,95,3,3,1,0,93,95,5,95,0,0,94,92,1,
        0,0,0,94,93,1,0,0,0,95,101,1,0,0,0,96,100,3,3,1,0,97,100,3,5,2,0,
        98,100,5,95,0,0,99,96,1,0,0,0,99,97,1,0,0,0,99,98,1,0,0,0,100,103,
        1,0,0,0,101,99,1,0,0,0,101,102,1,0,0,0,102,22,1,0,0,0,103,101,1,
        0,0,0,104,110,3,3,1,0,105,109,3,3,1,0,106,109,3,5,2,0,107,109,5,
        95,0,0,108,105,1,0,0,0,108,106,1,0,0,0,108,107,1,0,0,0,109,112,1,
        0,0,0,110,108,1,0,0,0,110,111,1,0,0,0,111,24,1,0,0,0,112,110,1,0,
        0,0,113,114,5,46,0,0,114,26,1,0,0,0,115,117,7,3,0,0,116,115,1,0,
        0,0,117,118,1,0,0,0,118,116,1,0,0,0,118,119,1,0,0,0,119,120,1,0,
        0,0,120,121,6,13,0,0,121,28,1,0,0,0,122,123,5,47,0,0,123,124,5,47,
        0,0,124,128,1,0,0,0,125,127,8,4,0,0,126,125,1,0,0,0,127,130,1,0,
        0,0,128,126,1,0,0,0,128,129,1,0,0,0,129,131,1,0,0,0,130,128,1,0,
        0,0,131,132,6,14,0,0,132,30,1,0,0,0,17,0,43,46,57,69,71,77,82,88,
        90,94,99,101,108,110,118,128,1,6,0,0
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