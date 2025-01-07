SELECT student_age,count(student_age) 
    FROM students 
    GROUP BY student_age
    HAVING (COUNT(student_age)>1);
