use crate::example_one as example;
use example::Profile;
use example::example;

pub fn hello() {
    println!("Hello hello module");
    example();
    let user1:Profile = Profile::new(String::from("Paul"),22,String::from("Lame"));
    user1.print_info();
}