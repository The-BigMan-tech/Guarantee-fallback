--*renaming a table
ALTER TABLE students 
    RENAME TO renamed 


--*ALTERING A COLUMN USING A TABLE
--^Adding a column
ALTER TABLE students 
    ADD COLUMN newColumn INTEGER;

--^Dropping or deleting a column
ALTER TABLE students 
    DROP COLUMN newColumn;

--^Renaming a column
ALTER TABLE students
    RENAME COLUMN scores TO fake_scores


--*DIRECTLY ALTERING A COLUMN
--^Setting the default value from a column
ALTER Table students
    ALTER COLUMN student_age 
        SET DEFAULT 20 

--^Adding a contraint to a column
ALTER TABLE students
    ALTER COLUMN student_age 
        SET NOT NULL

--^Changing the datatype of a column
ALTER TABLE students  
    ALTER COLUMN newColumn 
        SET DATA TYPE text