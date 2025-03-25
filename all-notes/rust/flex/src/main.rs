use std::{mem,any::type_name, str::Chars, vec};
fn _print_vector_type<T>(_vec: &Vec<T>) {
    println!("The type of the vector is: {}", type_name::<T>());
}
fn bytes<T>(vec:&Vec<T>)->usize {
    return vec.len() * mem::size_of::<T>();
}
struct Flex {
    internal:Vec<u8>
}
impl Flex {
    fn new<T>(vector:Vec<T>)->Flex where T: std::fmt::Display, {
        let mut re_representation:Vec<u8> = vec![];
        for num in &vector {
            let mut num_as_string:String = num.to_string();
            if num_as_string.starts_with('-') {
                num_as_string.remove(0);
                re_representation.push(0);
            }
            let mut characters:Chars<'_> = num_as_string.chars();
            let mut index:i32 = 0;

            while let (Some(c1),c2) = (characters.next(),characters.next()) {
                let mut _character_1:String = String::from("");
                _character_1 = if c1 == '0' {String::from("20")}else {c1.to_string()};
                let data_to_push =  
                    if let Some(c2) = c2 
                    {
                        let ch:u8 = format!("{_character_1}{c2}").parse::<u8>().unwrap();
                        if index + 1 == ((num_as_string.chars().count() as i32) - 1) {
                            if ch < 100 {format!("1{ch}").parse::<u8>().unwrap()}
                            else if ch >= 200 {
                                let ch2:u8 = ch - 200;
                                format!("21{ch2}").parse::<u8>().unwrap()
                            }
                            else {ch}
                        }else {ch}
                    }
                    else {
                        if c1=='0' {format!("220").parse::<u8>().unwrap()}
                        else {
                            if _character_1.len() < 2 {_character_1 = format!("0{_character_1}");}
                            format!("1{_character_1}").parse::<u8>().unwrap()
                        }
                    };
                    re_representation.push(data_to_push);
                    index += 2;
            }
        }
        println!("Rerepresentation {:?}",re_representation);
        return Flex {internal:re_representation}
    }

    fn get_internal(&self)->&Vec<u8> {
        return &self.internal
    }
    fn get_data<T>(&self,ind:usize)->i32 {
        let internal:&Vec<u8> = self.get_internal();
        let mut terminators:Vec<i32> = vec![0];
        for (index,num) in internal.iter().enumerate() {
            let termination_index = 
                if ((num >= &100u8) && (num < &200u8)) || (num >= &210u8) || (num == &220u8) {index as i32}
                else {continue};
            terminators.push(termination_index);
        }
        let termination_start:usize = terminators[ind] as usize;
        let termination_true_start:usize = termination_start + 1;
        let termination_end:usize = terminators[ind+1] as usize;
        let digits:&[u8] = &internal[termination_true_start..=termination_end];

        let mut string_data:String = String::from("");
        for digit in digits {
            let string_info:&str = if digit == &0u8 {"-"}
                else if digit < &100u8 {&digit.to_string()}
                else if (digit > &100u8) && (digit < &200u8)  {&(digit-100).to_string()}
                else if (digit >= &200u8) && (digit < &220u8) {&(format!("0{}",digit.to_string().chars().last().unwrap()))}
                else if digit == &220u8 {"0"}
                else {""};
            string_data += string_info;
        }
        return  string_data.parse::<i32>().unwrap();
    }
}
fn main() {
    let shoes: Vec<i32> = vec![1234,20,901,43,90090000,23885,900,9899,8876,8,8,8];
    println!("Original bytes:{}",bytes(&shoes));
    let flex_shoes:Flex = Flex::new(shoes);
    let test_data:i32 = flex_shoes.get_data::<i32>(2);
    println!("Test data: {test_data}");
    println!("Number of bytes of flexible vector:{}",bytes(&flex_shoes.internal))
} 

//when its a chunk that starts with zeros its 200 or 220 for one zero only.the one will be read as zero but it means thats the end of the last chunk.220-255 is still left to be utilized