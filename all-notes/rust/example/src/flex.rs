pub fn flex() {
    struct VariableSizeVec {
        outer: Vec<Vec<u8>>
    }

    impl VariableSizeVec {
        fn new() -> Self {
            VariableSizeVec {
                outer: Vec::new(),
            }
        }
        fn push(&mut self, value: u32) {
            let value_str:String = value.to_string();
            let mut inner:Vec<u8> = Vec::new();
            for chunk in value_str.as_bytes().chunks(2) {
                let byte_value:u8 = String::from_utf8_lossy(chunk).parse::<u8>().unwrap();
                inner.push(byte_value);
            }
            println!("{:?}", inner);
            self.outer.push(inner);
        }
        fn get(&self) -> Vec<u32> {
            println!("{:?}", self.outer);
            self.outer.iter().map(|inner| {
                let mut value = 0u32;
                for &byte in inner {
                    value = value * 100 + byte as u32; // Combine bytes into the original number
                }
                value
            }).collect()
        }
    }
    let mut v = VariableSizeVec::new();
    
    v.push(2025); // Will create inner vector [[20, 25]]
    v.push(4);    // Will create inner vector [[4]]

    // Retrieve and print the values
    let values = v.get();
    for value in values {
        println!("{}", value);
    }
    

}