-- CREATE TABLE Staff (
    -- staff_id SERIAL PRIMARY KEY,
    -- staff_name TEXT,
    -- job TEXT,
    -- work_experience TEXT
-- );
INSERT INTO staff 
    (staff_id,staff_name,job,work_experience)
    VALUES(72,'Matt','Teacher','Pro')

--SELECT student_name,staff_name FROM students CROSS JOIN staff

-- SELECT students.student_name,staff.work_experience 
    -- FROM students INNER JOIN staff
    -- ON students.unique_id = staff.staff_id

-- SELECT students.student_name,staff.work_experience 
    -- FROM students LEFT OUTER JOIN staff
    -- ON students.unique_id = staff.staff_id

SELECT students.student_name,staff.work_experience,staff.staff_name
    FROM students RIGHT OUTER JOIN staff
    ON  students.unique_id =  staff.staff_id