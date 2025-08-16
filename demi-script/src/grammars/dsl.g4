grammar DSL;

fragment LETTER: [a-zA-Z];
fragment DIGIT: [0-9];
fragment LIST: '[' (ATOM (',' ATOM)*)? ']';
// The entry point: a list of facts (simple sentences) terminated by full stops.
program: fact+ EOF;

// A fact consists of multiple tokens containing exactly one predicate and atoms interspersed with fillers.
fact
    : sentence TERMINATOR
    ;

// A sentence is a sequence of tokens containing exactly one predicate with atoms and fillers around it.
sentence
    : token+ 
        {
          // Action placeholder: Validate exactly one predicate and parse atoms/predicate into structure
        }
    ;

// Tokens can be atoms, predicates, aliases or fillers.
token
    : ATOM
    | PREDICATE
    | ALIAS
    | FILLER
    ;

// Atoms are either quoted strings, numbers, or list of numbers/strings.
ATOM
    : STRING_LITERAL
    | NUMBER
    | LIST
    ;

// Predicate tokens start with '*', followed by an identifier (no whitespace allowed inside).
PREDICATE
    : '*' IDENTIFIER
    ;

// Aliases start with '#', followed by an identifier.
ALIAS
    : '#' IDENTIFIER
    ;

// Fillers are any plain words that do not start with *, #, or quotes and are NOT numbers.
FILLER
    : (LETTER | '_') (LETTER | DIGIT | '_')*
    ;

// String literal supporting single quotes as per your example
STRING_LITERAL
    : '\'' (~['\\] | '\\' .)* '\''
    ;

// Number: integers or decimals (optional minus sign)
NUMBER
    : '-'? DIGIT+ ('.' DIGIT+)?
    ;

// Identifier for predicates and aliases
IDENTIFIER
    : LETTER (LETTER | DIGIT | '_')*
    ;

// Full stop terminates a fact
TERMINATOR
    : '.'
    ;

// Skip whitespace and newlines between tokens
WS
    : [ \t\r\n]+ -> skip
    ;

// Optionally skip comments (if you want to support them)
COMMENT
    : '//' ~[\r\n]* -> skip
    ;
