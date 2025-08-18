grammar DSL;
fragment LETTER: [a-zA-Z];
fragment DIGIT: [0-9];


program: (fact | aliasDeclaration)+ EOF;

fact: sentence TERMINATOR;

aliasDeclaration: LET ALIAS '=' PREDICATE TERMINATOR;

sentence: token+ ;

token:  ATOM | list | PREDICATE | ALIAS | PLAIN_WORD;

list: LSQUARE (ATOM (COMMA ATOM)*)? RSQUARE;


PUNCTUATION: (
    COMMA |
    COLON |
    LPAREN |
    RPAREN |
    LSQUARE |
    RSQUARE |
    SEMICOLON |
    QUESTION |
    EXCLAMATION 
)-> skip;


COMMA: ',';
COLON: ':';
LPAREN: '(';
RPAREN: ')';
LSQUARE: '[';
RSQUARE: ']';
SEMICOLON: ';';
QUESTION: '?';
EXCLAMATION: '!';


ATOM: NAME | NUMBER;

LET: 'let';
TERMINATOR:'.';


PREDICATE: '*' PLAIN_WORD;
ALIAS: '#' PLAIN_WORD;


NAME: ':' PLAIN_WORD;
NUMBER: '-'? DIGIT+ ('.' DIGIT+)?;
PLAIN_WORD: LETTER (LETTER | DIGIT | '_')*;


WS: [ \t\r\n]+ -> skip ;
COMMENT: '//' ~[\r\n]* -> skip;