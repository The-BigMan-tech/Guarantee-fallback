pub fn start() {
    let result: &[i32; 5] = &[1, 2, 3, 4, 5];
    println!("\nMacro usage\n");
    println!("result: {result:?}");

    macro_rules! example {
        () => {
            
        };
    }
}