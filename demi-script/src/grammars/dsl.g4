grammar DSL;
fragment LETTER: [a-zA-Z];
fragment DIGIT: [0-9];


program: (fact | aliasDeclaration)+ EOF;

fact: sentence TERMINATOR;

aliasDeclaration: LET PLAIN_WORD EQUALS PREDICATE TERMINATOR;

sentence: token+ ;

token: (NAME | NUMBER) | list | PREDICATE | ALIAS | PLAIN_WORD |
    (
        COMMA |
        COLON |
        LPAREN |
        RPAREN |
        LSQUARE |
        RSQUARE |
        SEMICOLON |
        QUESTION |
        EXCLAMATION |
        APOSTROPHE
    );

list: LSQUARE ((NAME | NUMBER) (COMMA (NAME | NUMBER))*)? RSQUARE;


COMMA: ',';
COLON: ':';
LPAREN: '(';
RPAREN: ')';
LSQUARE: '[';
RSQUARE: ']';
SEMICOLON: ';';
QUESTION: '?';
EXCLAMATION: '!';
APOSTROPHE:'\'';

EQUALS: '=';
LET: 'let';
TERMINATOR:'.';

PREDICATE: '*' PLAIN_WORD;
ALIAS: '#' PLAIN_WORD;

NAME: ':' PLAIN_WORD;
NUMBER: '-'? DIGIT+ ('.' DIGIT+)?;
PLAIN_WORD: LETTER (LETTER | DIGIT | '_')*;

WS: [ \t\r\n]+ -> skip ;
COMMENT: '//' ~[\r\n]* -> skip;