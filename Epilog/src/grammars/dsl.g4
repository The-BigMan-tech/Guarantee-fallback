grammar DSL;
fragment LETTER: [a-zA-Z];
fragment DIGIT: [0-9];


program: (NEW_LINE | fact | aliasDeclaration)+ EOF;

fact: sentence TERMINATOR;

aliasDeclaration: ALIAS_KW PLAIN_WORD (EQUALS PREDICATE)? TERMINATOR;

sentence: token+ ;

token: ((NAME | NUMBER) | list | PREDICATE | ALIAS | PLAIN_WORD ) |
    (GENERIC_REF | SINGLE_SUBJECT_REF | GROUP_SUBJECT_REF | SINGLE_OBJECT_REF | GROUP_OBJECT_REF) | 
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

TERMINATOR:PERIOD (NEW_LINE)?;
fragment PERIOD:'.';
fragment COLON:':';

PREDICATE: '*' PLAIN_WORD;
ALIAS: '#' PLAIN_WORD;

NAME: (COLON PLAIN_WORD) | ('!' PLAIN_WORD);
NUMBER: '-'? DIGIT+ ('.' DIGIT+)?;
PLAIN_WORD: LETTER (LETTER | DIGIT | '_')*;

GENERIC_REF:'<' 'ref' COLON NUMBER '>';

SINGLE_SUBJECT_REF:'<' SINGLE_NOUN_REF '>';
GROUP_SUBJECT_REF:'<' GROUP_NOUN_REF '>';

SINGLE_OBJECT_REF:'<' SINGLE_NOUN_OBJECT_REF COLON NUMBER '>';
GROUP_OBJECT_REF:'<' GROUP_NOUN_OBJECT_REF COLON NUMBER '>';

fragment SINGLE_NOUN_OBJECT_REF:'him' | 'her' | 'it' | 'his';
fragment GROUP_NOUN_OBJECT_REF:'them' | 'their';

fragment SINGLE_NOUN_REF:'He' | 'She' | 'It';
fragment GROUP_NOUN_REF:'They';

NEW_LINE:('\r\n' | '\r' | '\n');
WS:[ \t]+ -> skip ;
COMMENT: '//' ~[\r\n]* -> skip;