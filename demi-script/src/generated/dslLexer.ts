
import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";


export class DSLLexer extends antlr.Lexer {
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

    public static readonly channelNames = [
        "DEFAULT_TOKEN_CHANNEL", "HIDDEN"
    ];

    public static readonly literalNames = [
        null, "'='", "'['", "']'", "'let'", "','", null, null, null, null, 
        null, "'.'"
    ];

    public static readonly symbolicNames = [
        null, null, null, null, "LET", "COMMA", "PREDICATE", "ALIAS", "NAME", 
        "NUMBER", "PLAIN_WORD", "TERMINATOR", "WS", "COMMENT"
    ];

    public static readonly modeNames = [
        "DEFAULT_MODE",
    ];

    public static readonly ruleNames = [
        "T__0", "T__1", "T__2", "LETTER", "DIGIT", "LET", "COMMA", "PREDICATE", 
        "ALIAS", "NAME", "NUMBER", "PLAIN_WORD", "TERMINATOR", "WS", "COMMENT",
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
        4,0,13,101,6,-1,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,
        2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,
        13,7,13,2,14,7,14,1,0,1,0,1,1,1,1,1,2,1,2,1,3,1,3,1,4,1,4,1,5,1,
        5,1,5,1,5,1,6,1,6,1,7,1,7,1,7,1,8,1,8,1,8,1,9,1,9,1,9,1,10,3,10,
        58,8,10,1,10,4,10,61,8,10,11,10,12,10,62,1,10,1,10,4,10,67,8,10,
        11,10,12,10,68,3,10,71,8,10,1,11,1,11,1,11,1,11,5,11,77,8,11,10,
        11,12,11,80,9,11,1,12,1,12,1,13,4,13,85,8,13,11,13,12,13,86,1,13,
        1,13,1,14,1,14,1,14,1,14,5,14,95,8,14,10,14,12,14,98,9,14,1,14,1,
        14,0,0,15,1,1,3,2,5,3,7,0,9,0,11,4,13,5,15,6,17,7,19,8,21,9,23,10,
        25,11,27,12,29,13,1,0,4,2,0,65,90,97,122,1,0,48,57,3,0,9,10,13,13,
        32,32,2,0,10,10,13,13,107,0,1,1,0,0,0,0,3,1,0,0,0,0,5,1,0,0,0,0,
        11,1,0,0,0,0,13,1,0,0,0,0,15,1,0,0,0,0,17,1,0,0,0,0,19,1,0,0,0,0,
        21,1,0,0,0,0,23,1,0,0,0,0,25,1,0,0,0,0,27,1,0,0,0,0,29,1,0,0,0,1,
        31,1,0,0,0,3,33,1,0,0,0,5,35,1,0,0,0,7,37,1,0,0,0,9,39,1,0,0,0,11,
        41,1,0,0,0,13,45,1,0,0,0,15,47,1,0,0,0,17,50,1,0,0,0,19,53,1,0,0,
        0,21,57,1,0,0,0,23,72,1,0,0,0,25,81,1,0,0,0,27,84,1,0,0,0,29,90,
        1,0,0,0,31,32,5,61,0,0,32,2,1,0,0,0,33,34,5,91,0,0,34,4,1,0,0,0,
        35,36,5,93,0,0,36,6,1,0,0,0,37,38,7,0,0,0,38,8,1,0,0,0,39,40,7,1,
        0,0,40,10,1,0,0,0,41,42,5,108,0,0,42,43,5,101,0,0,43,44,5,116,0,
        0,44,12,1,0,0,0,45,46,5,44,0,0,46,14,1,0,0,0,47,48,5,42,0,0,48,49,
        3,23,11,0,49,16,1,0,0,0,50,51,5,35,0,0,51,52,3,23,11,0,52,18,1,0,
        0,0,53,54,5,58,0,0,54,55,3,23,11,0,55,20,1,0,0,0,56,58,5,45,0,0,
        57,56,1,0,0,0,57,58,1,0,0,0,58,60,1,0,0,0,59,61,3,9,4,0,60,59,1,
        0,0,0,61,62,1,0,0,0,62,60,1,0,0,0,62,63,1,0,0,0,63,70,1,0,0,0,64,
        66,5,46,0,0,65,67,3,9,4,0,66,65,1,0,0,0,67,68,1,0,0,0,68,66,1,0,
        0,0,68,69,1,0,0,0,69,71,1,0,0,0,70,64,1,0,0,0,70,71,1,0,0,0,71,22,
        1,0,0,0,72,78,3,7,3,0,73,77,3,7,3,0,74,77,3,9,4,0,75,77,5,95,0,0,
        76,73,1,0,0,0,76,74,1,0,0,0,76,75,1,0,0,0,77,80,1,0,0,0,78,76,1,
        0,0,0,78,79,1,0,0,0,79,24,1,0,0,0,80,78,1,0,0,0,81,82,5,46,0,0,82,
        26,1,0,0,0,83,85,7,2,0,0,84,83,1,0,0,0,85,86,1,0,0,0,86,84,1,0,0,
        0,86,87,1,0,0,0,87,88,1,0,0,0,88,89,6,13,0,0,89,28,1,0,0,0,90,91,
        5,47,0,0,91,92,5,47,0,0,92,96,1,0,0,0,93,95,8,3,0,0,94,93,1,0,0,
        0,95,98,1,0,0,0,96,94,1,0,0,0,96,97,1,0,0,0,97,99,1,0,0,0,98,96,
        1,0,0,0,99,100,6,14,0,0,100,30,1,0,0,0,9,0,57,62,68,70,76,78,86,
        96,1,6,0,0
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