use std::{cell::Ref, rc::{Rc,Weak}, vec};
use std::cell::{RefCell,RefMut};

use teacher::Teacher;
use student::Student;
mod teacher{
    use super::{Rc,RefCell,Student,RefMut};
    pub struct Teacher {
        pub name:String,
        pub students:Vec<Rc<Student>>
    }
    impl Teacher {
        pub fn to_rc(name:&str,students:Vec<Rc<Student>>)->Rc<RefCell<Teacher>> {
            return Rc::new(RefCell::new(Teacher {
                name:name.to_string(),students
            }));
        }
        pub fn add_student(teacher:&Rc<RefCell<Teacher>>,student:&Rc<Student>) {
            let mut mut_teacher: RefMut<'_, Teacher> = teacher.borrow_mut();
            mut_teacher.students.push(Rc::clone(student));
        }
    }
}
mod student {
    use super::{Teacher,RefCell,Weak,Rc};
    pub struct Student {
        pub name:String,
        pub teacher:Weak<RefCell<Teacher>>
    }
    impl Student {
        pub fn to_rc(name:&str,teacher:&Rc<RefCell<Teacher>>)->Rc<Student> {
            return Rc::new(Student {
                name:name.to_string(),teacher:Rc::downgrade(teacher)
            })
        }
        pub fn get_teacher(&self)->Rc<RefCell<Teacher>> {
            let teacher: Rc<RefCell<Teacher>> = self.teacher.upgrade().unwrap();
            return teacher
        }
    }
}

pub fn close()->() {
    println!("Hello closed");
    let mut person:String = String::from("Hello world");
    let items:Vec<&str> = vec!["one","two","three"];

    let closed = move || {
        person.push_str("Hi");
        let mut car: String = person;
        car.push_str("Hello world");
        println!("Here are your items: {:?}",items);
        return format!("Here is person: {car}");
    };
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


    let matt: Rc<RefCell<Teacher>> = Teacher::to_rc("Matt", vec![]);
    let paul: Rc<Student> = Student::to_rc("paul",&matt);
    let john:Rc<Student>  = Student::to_rc("john", &matt);
    Teacher::add_student(&matt,&paul);
    Teacher::add_student(&matt,&john);
    let matt_borrow: Ref<'_, Teacher> = matt.borrow();


    println!("\nTeacher: {}",matt_borrow.name);
    for i in &matt_borrow.students {
        println!("Student: {}",i.name)
    }
    println!("\nStudent: {}",paul.name);
    println!("Teacher: {}",paul.get_teacher().borrow().name);

    println!("\nStudent: {}",john.name);
    println!("Teacher: {}",john.get_teacher().borrow().name);
}