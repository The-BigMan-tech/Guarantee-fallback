use std::{rc::{Rc,Weak}, vec};
use std::cell::{RefCell,RefMut};

use teacher::{Teacher, TeacherTraits};
use student::{Student, StudentTraits};
mod teacher{
    use super::{Rc,RefCell,Student,RefMut};
    pub struct Teacher {
        pub name:String,
        pub students:Vec<Rc<RefCell<Student>>>
    }
    impl Teacher {
        pub fn hire(name:&str)->Rc<RefCell<Teacher>> {
            Rc::new(RefCell::new(Teacher {
                name:name.to_string(),students:vec![]
            }))
        }
        pub fn swap(teacher_1:&Rc<RefCell<Teacher>>,teacher_2:&Rc<RefCell<Teacher>>) {
            let teacher_1_students: Vec<Rc<RefCell<Student>>> = teacher_1.borrow().students.to_owned();
            let teacher_2_students:Vec<Rc<RefCell<Student>>> = teacher_2.borrow().students.to_owned();

            teacher_1.borrow_mut().students = teacher_2_students;
            teacher_2.borrow_mut().students = teacher_1_students;

            let update_students = |student:&mut Rc<RefCell<Student>>,teacher:&Rc<RefCell<Teacher>>| {student.borrow_mut().teacher = Rc::downgrade(teacher);};
            teacher_1.borrow_mut().students.iter_mut().for_each(|student |{update_students(student,teacher_1)});
            teacher_2.borrow_mut().students.iter_mut().for_each(|student|{update_students(student,teacher_2)});
        }
        pub fn fire(_teacher:Rc<RefCell<Teacher>>) {}
    }
    pub trait TeacherTraits {
        fn teach(&self,student:&Rc<RefCell<Student>>);
        fn get_students(&self)->Vec<String>;
    }
    impl TeacherTraits for Rc<RefCell<Teacher>> {
        fn teach(&self,student:&Rc<RefCell<Student>>) {
            let mut mut_teacher: RefMut<'_, Teacher> = self.borrow_mut();
            let mut mut_student: RefMut<'_, Student> = student.borrow_mut();
            mut_teacher.students.push(Rc::clone(student));
            mut_student.teacher = Rc::downgrade(self)
        }
        fn get_students(&self)->Vec<String> {
            return self.borrow().students.iter().map(|student| student.borrow().name.to_owned()).collect()
        }
    }
}
mod student {
    use super::{Rc, RefCell, Teacher, Weak};
    pub struct Student {
        pub name:String,
        pub teacher:Weak<RefCell<Teacher>>
    }
    impl Student {
        pub fn enroll(name:&str)->Rc<RefCell<Student>> {
            Rc::new(RefCell::new(Student {
                name:name.to_string(),teacher:Rc::downgrade(&Teacher::hire(""))
            }))
        }
    }
    pub trait StudentTraits {
        fn print_teacher(self:&Self);
        fn get_teacher(self:&Self)->Option<Rc<RefCell<Teacher>>>;
    }
    impl StudentTraits for Rc<RefCell<Student>> {
        fn print_teacher(self:&Self) {
            if let Some(teacher) = self.get_teacher() {
                println!("{} teacher is {}",self.borrow().name,teacher.borrow().name)
            }else {
                println!("{} has no teacher",self.borrow().name)
            };
        }
        fn get_teacher(self:&Self)->Option<Rc<RefCell<Teacher>>> {
            return self.borrow().teacher.upgrade()
        }
    }
}
pub fn cyclic() {
    println!("\nHello cyle\n");
    let matt: Rc<RefCell<Teacher>> = Teacher::hire("Matt");
    let paul: Rc<RefCell<Student>> = Student::enroll("paul");
    let john: Rc<RefCell<Student>> = Student::enroll("john");
    matt.teach(&paul);
    matt.teach(&john);
    Teacher::fire(matt);

    let andrew: Rc<RefCell<Teacher>> = Teacher::hire("Andrew");
    let philip: Rc<RefCell<Teacher>> = Teacher::hire("Philip");
    andrew.teach(&paul);
    philip.teach(&john);
    Teacher::swap(&andrew, &philip);
    paul.print_teacher();
    // Teacher::fire(andrew);
    john.print_teacher();

    println!("{} students:{:?}",andrew.borrow().name,andrew.get_students());
    println!("{} students:{:?}",philip.borrow().name,philip.get_students());

    let mut f: Box<i32> = Box::new(10);
    *f = 50;
    println!("f value: {f}");
}


pub fn close()->() {
    println!("Hello closed");
    let mut person:String = String::from("Hello world");
    let person_2:String = String::from("sss");
    let items:Vec<&str> = vec!["one","two","three"];

    let closed = || {
        person.push_str("Hi");
        let mut car: String = person;
        car.push_str("Hello world");
        println!("Here are your items: {:?}",items);
        println!("{person_2}");
        return format!("Here is person: {car}");
    };
    println!("{person_2}");
    println!("{}",closed());
    let v1: Vec<i32> = vec![1, 2, 3];
    let d:Vec<i32> =v1.iter().map(|x:&i32| x + 1).collect();
    println!("The value of d is: {:?}",d);
}
fn drop<T>(_variable:T) {}

pub fn smart()->() {
    println!("Hello smart pointer");
    struct House {
        housetype:String,
        neighbour:Option<Box<House>>
    }
    let duplex: House = House {
        housetype:String::from("duplex"),
        neighbour:None
    };
    let mansion: House = House {
        housetype:String::from("mansion"),
        neighbour:Some(Box::new(duplex))
    };
    println!("Name of buildin 1 {}",mansion.housetype);
    let neighbour:House = *mansion.neighbour.unwrap();
    println!("Name of building 2: {}",neighbour.housetype);
    // let neighbour: Box<House> = mansion.neighbour.unwrap();
    // println!("Name of building 2: {}",neighbour.housetype)

    let mut x: i32 = 10;
    let y: &mut i32 =  &mut x;
    *y = 20;
    let z: i32 = *y;
    let i = &x;
    println!("{x}");
    println!("{z}");
    println!("I{i}");

    let mut s: Vec<String> = vec![String::from("jjj")];
    let g: &mut Vec<String> = &mut s;
    *g = Vec::new();
    println!("{:?}",s);

    let z = Box::new(String::from("kk"));
    let f = *z;
    let ss = &f;
    println!("{}",(ss));

    let x: String = String::from("Hello");
    drop(x);

    let mut owner_a: Rc<String> = Rc::new(String::from("Hello"));
    let owner_b: Rc<String> = Rc::clone(&owner_a);
    owner_a = Rc::clone(&owner_b);
    println!("A count: {}",Rc::strong_count(&owner_a));
    println!("B count: {}",Rc::strong_count(&owner_b));
    
}