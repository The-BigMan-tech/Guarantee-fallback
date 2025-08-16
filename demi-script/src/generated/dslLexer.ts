
import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";


export class DSLLexer extends antlr.Lexer {
    public static readonly ATOM = 1;
    public static readonly PREDICATE = 2;
    public static readonly ALIAS = 3;
    public static readonly FILLER = 4;
    public static readonly STRING_LITERAL = 5;
    public static readonly NUMBER = 6;
    public static readonly IDENTIFIER = 7;
    public static readonly TERMINATOR = 8;
    public static readonly WS = 9;
    public static readonly COMMENT = 10;

    public static readonly channelNames = [
        "DEFAULT_TOKEN_CHANNEL", "HIDDEN"
    ];

    public static readonly literalNames = [
        null, null, null, null, null, null, null, null, "'.'"
    ];

    public static readonly symbolicNames = [
        null, "ATOM", "PREDICATE", "ALIAS", "FILLER", "STRING_LITERAL", 
        "NUMBER", "IDENTIFIER", "TERMINATOR", "WS", "COMMENT"
    ];

    public static readonly modeNames = [
        "DEFAULT_MODE",
    ];

    public static readonly ruleNames = [
        "LETTER", "DIGIT", "LIST", "ATOM", "PREDICATE", "ALIAS", "FILLER", 
        "STRING_LITERAL", "NUMBER", "IDENTIFIER", "TERMINATOR", "WS", "COMMENT",
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
        4,0,10,123,6,-1,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,
        2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,1,
        0,1,0,1,1,1,1,1,2,1,2,1,2,1,2,5,2,36,8,2,10,2,12,2,39,9,2,3,2,41,
        8,2,1,2,1,2,1,3,1,3,1,3,3,3,48,8,3,1,4,1,4,1,4,1,5,1,5,1,5,1,6,1,
        6,3,6,58,8,6,1,6,1,6,1,6,5,6,63,8,6,10,6,12,6,66,9,6,1,7,1,7,1,7,
        1,7,5,7,72,8,7,10,7,12,7,75,9,7,1,7,1,7,1,8,3,8,80,8,8,1,8,4,8,83,
        8,8,11,8,12,8,84,1,8,1,8,4,8,89,8,8,11,8,12,8,90,3,8,93,8,8,1,9,
        1,9,1,9,1,9,5,9,99,8,9,10,9,12,9,102,9,9,1,10,1,10,1,11,4,11,107,
        8,11,11,11,12,11,108,1,11,1,11,1,12,1,12,1,12,1,12,5,12,117,8,12,
        10,12,12,12,120,9,12,1,12,1,12,0,0,13,1,0,3,0,5,0,7,1,9,2,11,3,13,
        4,15,5,17,6,19,7,21,8,23,9,25,10,1,0,5,2,0,65,90,97,122,1,0,48,57,
        2,0,39,39,92,92,3,0,9,10,13,13,32,32,2,0,10,10,13,13,138,0,7,1,0,
        0,0,0,9,1,0,0,0,0,11,1,0,0,0,0,13,1,0,0,0,0,15,1,0,0,0,0,17,1,0,
        0,0,0,19,1,0,0,0,0,21,1,0,0,0,0,23,1,0,0,0,0,25,1,0,0,0,1,27,1,0,
        0,0,3,29,1,0,0,0,5,31,1,0,0,0,7,47,1,0,0,0,9,49,1,0,0,0,11,52,1,
        0,0,0,13,57,1,0,0,0,15,67,1,0,0,0,17,79,1,0,0,0,19,94,1,0,0,0,21,
        103,1,0,0,0,23,106,1,0,0,0,25,112,1,0,0,0,27,28,7,0,0,0,28,2,1,0,
        0,0,29,30,7,1,0,0,30,4,1,0,0,0,31,40,5,91,0,0,32,37,3,7,3,0,33,34,
        5,44,0,0,34,36,3,7,3,0,35,33,1,0,0,0,36,39,1,0,0,0,37,35,1,0,0,0,
        37,38,1,0,0,0,38,41,1,0,0,0,39,37,1,0,0,0,40,32,1,0,0,0,40,41,1,
        0,0,0,41,42,1,0,0,0,42,43,5,93,0,0,43,6,1,0,0,0,44,48,3,15,7,0,45,
        48,3,17,8,0,46,48,3,5,2,0,47,44,1,0,0,0,47,45,1,0,0,0,47,46,1,0,
        0,0,48,8,1,0,0,0,49,50,5,42,0,0,50,51,3,19,9,0,51,10,1,0,0,0,52,
        53,5,35,0,0,53,54,3,19,9,0,54,12,1,0,0,0,55,58,3,1,0,0,56,58,5,95,
        0,0,57,55,1,0,0,0,57,56,1,0,0,0,58,64,1,0,0,0,59,63,3,1,0,0,60,63,
        3,3,1,0,61,63,5,95,0,0,62,59,1,0,0,0,62,60,1,0,0,0,62,61,1,0,0,0,
        63,66,1,0,0,0,64,62,1,0,0,0,64,65,1,0,0,0,65,14,1,0,0,0,66,64,1,
        0,0,0,67,73,5,39,0,0,68,72,8,2,0,0,69,70,5,92,0,0,70,72,9,0,0,0,
        71,68,1,0,0,0,71,69,1,0,0,0,72,75,1,0,0,0,73,71,1,0,0,0,73,74,1,
        0,0,0,74,76,1,0,0,0,75,73,1,0,0,0,76,77,5,39,0,0,77,16,1,0,0,0,78,
        80,5,45,0,0,79,78,1,0,0,0,79,80,1,0,0,0,80,82,1,0,0,0,81,83,3,3,
        1,0,82,81,1,0,0,0,83,84,1,0,0,0,84,82,1,0,0,0,84,85,1,0,0,0,85,92,
        1,0,0,0,86,88,5,46,0,0,87,89,3,3,1,0,88,87,1,0,0,0,89,90,1,0,0,0,
        90,88,1,0,0,0,90,91,1,0,0,0,91,93,1,0,0,0,92,86,1,0,0,0,92,93,1,
        0,0,0,93,18,1,0,0,0,94,100,3,1,0,0,95,99,3,1,0,0,96,99,3,3,1,0,97,
        99,5,95,0,0,98,95,1,0,0,0,98,96,1,0,0,0,98,97,1,0,0,0,99,102,1,0,
        0,0,100,98,1,0,0,0,100,101,1,0,0,0,101,20,1,0,0,0,102,100,1,0,0,
        0,103,104,5,46,0,0,104,22,1,0,0,0,105,107,7,3,0,0,106,105,1,0,0,
        0,107,108,1,0,0,0,108,106,1,0,0,0,108,109,1,0,0,0,109,110,1,0,0,
        0,110,111,6,11,0,0,111,24,1,0,0,0,112,113,5,47,0,0,113,114,5,47,
        0,0,114,118,1,0,0,0,115,117,8,4,0,0,116,115,1,0,0,0,117,120,1,0,
        0,0,118,116,1,0,0,0,118,119,1,0,0,0,119,121,1,0,0,0,120,118,1,0,
        0,0,121,122,6,12,0,0,122,26,1,0,0,0,17,0,37,40,47,57,62,64,71,73,
        79,84,90,92,98,100,108,118,1,6,0,0
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