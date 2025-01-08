SELECT staff_name FROM staff
    UNION
SELECT student_name FROM students;

SELECT staff_name FROM staff
    INTERSECT
SELECT student_name FROM students