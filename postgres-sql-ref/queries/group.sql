SELECT student_name,student_age,
    SUM(student_age) AS Cumulative_Age 
    FROM students 
    GROUP BY student_age,student_name;


