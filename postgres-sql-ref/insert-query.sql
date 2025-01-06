INSERT INTO public.students 
    (student_name,student_age,student_class,haspaidfully,subjects,scores)
VALUES
    (
        'bolaji',20,'ss3',true,ARRAY['English','Mathematics','Physics'],
        ROW(100,70,60,40,NULL)
    );