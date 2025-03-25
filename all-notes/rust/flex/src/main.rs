use std::{mem,any::type_name, str::Chars, vec,fmt::Display};
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
    fn new<T:Display>(vector:Vec<T>)->Flex  {
        let mut instance:Flex = Self {internal:Vec::new()};
        let mut re_representation:Vec<u8> = vec![];
        for num in vector {instance.create_representation(num ,&mut re_representation)}
        instance.internal = re_representation;
        return instance
    }
    fn create_representation<T:Display>(&self,num:T,offload:&mut Vec<u8>) {
        let mut num_as_string:String = num.to_string();
        if num_as_string.starts_with('-') {
            num_as_string.remove(0);
            offload.push(0);
        }
        let mut characters:Chars<'_> = num_as_string.chars();
        let mut index:i32 = 0;
        while let (Some(c1),c2) = (characters.next(),characters.next()) {
            let mut _character_1:String = String::from("");
            _character_1 = if c1 == '0' {String::from("20")}else {c1.to_string()};
            let data_to_push:u8 = {
                if let Some(c2) = c2 {
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
                }
            };
            offload.push(data_to_push);
            index += 2;
        }
    }
    fn get_internal(&self)->&Vec<u8> {
        return &self.internal
    }
    fn get_data<T>(&self,mut ind:usize)->i32 {
        ind -= 1;
        let internal:&Vec<u8> = self.get_internal();
        let mut terminators:Vec<i32> = vec![0];
        let mut string_data:String = String::from("");
        for (index,num) in internal.iter().enumerate() {
            let termination_index:i32 = {
                if ((num >= &100u8) && (num < &200u8)) || (num >= &210u8) || (num == &220u8) {index as i32}
                else {continue}
            };
            terminators.push(termination_index);
        }
        {
            let digits:&[u8] = {
                let own_terminators:Vec<i32> = terminators;
                let termination_start:usize = (own_terminators[ind] as usize) + 1;
                let termination_end:usize = own_terminators[ind+1] as usize;
                let digits:&[u8] = &internal[termination_start..=termination_end];
                digits
            };
            for digit in digits {
                string_data += & { 
                    if digit == &0u8 {String::from("-")}
                    else if digit < &100u8 {digit.to_string()}
                    else if (digit > &100u8) && (digit < &200u8)  {(digit-100).to_string()}
                    else if (digit >= &200u8) && (digit < &220u8) {format!("0{}",digit.to_string().chars().last().unwrap())}
                    else if digit == &220u8 {String::from("0")}
                    else {String::from("")}
                }
            };
            return string_data.parse::<i32>().unwrap();
        }
    }
    fn push<T:Display>(&mut self,num:T) {
        let mut offload:Vec<u8> = vec![];
        self.create_representation(num, &mut offload);
        self.internal.append(&mut offload);
        println!("New data to push: {:?}",offload)
    }
    fn clear(&mut self) {
        self.internal.clear();
    }
    fn reset(&mut self) {
        self.internal = vec![]
    }
}
fn main() {
    let shoes: Vec<i32> = vec![1234,20,901,43,90090000,23885,900,9899,8876,8,7,8];
    println!("Original bytes:{}",bytes(&shoes));

    let mut flex_shoes:Flex = Flex::new(shoes);
    println!("Number of bytes of flexible vector:{}",bytes(&flex_shoes.internal));

    let re_rep:&Vec<u8> = flex_shoes.get_internal();
    let test_data:i32 = flex_shoes.get_data::<i32>(11);

    println!("Test data: {test_data}");
    println!("Test re-rep: {:?}",re_rep);

    flex_shoes.push(100000);
    flex_shoes.push(10);
    flex_shoes.push(-30000);
    println!("After pushing: {:?}",flex_shoes.get_internal());
    println!("Number of bytes of flexible vector:{}",bytes(&flex_shoes.internal));

    flex_shoes.clear();
    println!("Number of bytes of flexible vector:{}",bytes(&flex_shoes.internal));

    flex_shoes.push(560);
    println!("Number of bytes of flexible vector:{}",bytes(&flex_shoes.internal));

    flex_shoes.reset();
    println!("Number of bytes of flexible vector:{}",bytes(&flex_shoes.internal));

    let stats:Vec<i64> = vec![23,77,88,99,10,11,11,11,1,1,1,99,9,999,11,22,33,22,23,33,33];
    let flex_stats:Flex = Flex::new(stats);
    println!("Number of bytes of flexible vector:{}",bytes(&flex_stats.internal));
} 

//when its a chunk that starts with zeros its 200 or 220 for one zero only.the one will be read as zero but it means thats the end of the last chunk.220-255 is still left to be utilized