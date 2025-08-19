grammar DSL;
fragment LETTER: [a-zA-Z];
fragment DIGIT: [0-9];


program: (NEW_LINE | fact | aliasDeclaration)+ EOF;

fact: sentence TERMINATOR;

aliasDeclaration: LET PLAIN_WORD EQUALS PREDICATE TERMINATOR;

sentence: token+ ;

token: (NAME | NUMBER) | SINGLE_REF | GROUP_REF | list | PREDICATE | ALIAS | PLAIN_WORD |
    (
        COMMA |
        LPAREN |
        RPAREN |
        SEMICOLON |
        QUESTION |
        EXCLAMATION |
        APOSTROPHE
    );

list: LSQUARE ((NAME | NUMBER) (COMMA (NAME | NUMBER))*)? RSQUARE;


COMMA: ',';
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

TERMINATOR:(PERIOD | (PERIOD NEW_LINE));
fragment PERIOD:'.';

PREDICATE: '*' PLAIN_WORD;
ALIAS: '#' PLAIN_WORD;

NAME: ':' PLAIN_WORD;
NUMBER: '-'? DIGIT+ ('.' DIGIT+)?;
PLAIN_WORD: LETTER (LETTER | DIGIT | '_')*;

SINGLE_REF:'<' SINGLE_NOUN_REF '>';
GROUP_REF:'<' GROUP_NOUN_REF '>';

fragment SINGLE_NOUN_REF:'He' | 'She' | 'It';
fragment GROUP_NOUN_REF:'They';

NEW_LINE:('\r\n' | '\r' | '\n');
WS: [ \t]+ -> skip ;
COMMENT: '//' ~[\r\n]* -> skip;