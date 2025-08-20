grammar DSL;
fragment LETTER: [a-zA-Z];
fragment DIGIT: [0-9];


program: (NEW_LINE | fact | aliasDeclaration)+ EOF;

fact: sentence TERMINATOR;

aliasDeclaration: ALIAS_KW PLAIN_WORD EQUALS PREDICATE TERMINATOR;

sentence: token+ ;

token: ((NAME | NUMBER) | list | PREDICATE | ALIAS | PLAIN_WORD ) |
    (SINGLE_SUBJECT_REF | GROUP_SUBJECT_REF | SINGLE_OBJECT_REF | GROUP_OBJECT_REF) | 
    (COMMA | LPAREN | RPAREN | SEMICOLON | QUESTION | EXCLAMATION | APOSTROPHE);

list: LSQUARE ((NAME | NUMBER | list) (COMMA (NAME | NUMBER | list))*)? RSQUARE;

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
ALIAS_KW:'alias';

TERMINATOR:(PERIOD | (PERIOD NEW_LINE));
fragment PERIOD:'.';

PREDICATE: '*' PLAIN_WORD;
ALIAS: '#' PLAIN_WORD;

NAME: (':' PLAIN_WORD) | ('!' PLAIN_WORD);
NUMBER: '-'? DIGIT+ ('.' DIGIT+)?;
PLAIN_WORD: LETTER (LETTER | DIGIT | '_')*;
SINGLE_SUBJECT_REF:'<' SINGLE_NOUN_REF '>';
GROUP_SUBJECT_REF:'<' GROUP_NOUN_REF '>';

SINGLE_OBJECT_REF:'<' SINGLE_NOUN_OBJECT_REF '>';
GROUP_OBJECT_REF:'<' GROUP_NOUN_OBJECT_REF '>';

fragment SINGLE_NOUN_OBJECT_REF:'him' | 'her' | 'it';
fragment GROUP_NOUN_OBJECT_REF:'them';

fragment SINGLE_NOUN_REF:'He' | 'She' | 'It';
fragment GROUP_NOUN_REF:'They';

NEW_LINE:('\r\n' | '\r' | '\n');
WS:[ \t]+ -> skip ;
COMMENT: '//' ~[\r\n]* -> skip;