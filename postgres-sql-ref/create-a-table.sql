CREATE TYPE examscores AS (
    english INTEGER,
    mathematics INTEGER,
    chemistry INTEGER,
    physics INTEGER,
    biology INTEGER
);

CREATE TABLE Students (
    student_name TEXT,
    student_age INTEGER,
    student_class TEXT,
    hasPaidPartially BOOLEAN,
    hasPaidFully BOOLEAN,
    subjects TEXT[],
    scores examscores
);
