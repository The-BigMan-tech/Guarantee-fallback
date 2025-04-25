pub fn hello() {
    println!("Hello world");
    let name: String = String::from("hhhss");
    {
        let name_2: String = name;
        println!("{name_2:?}");
    }
}