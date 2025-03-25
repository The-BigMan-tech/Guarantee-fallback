use std::{fmt::Display,str::{Chars, FromStr}, vec};
mod flex_usage;

struct Flex {
    internal:Vec<u8>
}
impl Flex {
    fn new<T:Display +  Into<i64> >(vector:Vec<T>)->Flex  {
        let mut instance:Flex = Self {internal:Vec::new()};
        let mut re_representation:Vec<u8> = vec![];
        for num in vector {instance.create_representation(num ,&mut re_representation)}
        instance.internal = re_representation;
        return instance
    }
    fn create_representation<T:Display + Into<i64>>(&self,num:T,offload:&mut Vec<u8>) {
        let num:i64 = num.into();
        let sign_bit:u8 = if num >= 0 { 1 } else { 0 };
        let parity_bit:u8 = if num.abs() % 2 == 0 { 0 } else { 1 };
        let encoded_num:u8 = ((num.abs() as u8) << 2) | (sign_bit | (parity_bit << 1));

        let is_negative:bool = encoded_num & 1 == 0;
        println!("Num before: {num} Encoding schema {encoded_num} is neg: {is_negative}");
        let num_as_string:String = encoded_num.to_string();
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
                    if (c1=='0') && (is_negative == false) {
                        format!("220").parse::<u8>().unwrap()
                    }
                    else {
                        println!("Reached some stuff");
                        if _character_1.len() < 2 {_character_1 = format!("0{_character_1}");}
                        if (c1=='0') && (is_negative) {
                            0
                        }else {
                            format!("1{_character_1}").parse::<u8>().unwrap()
                        }
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
    fn get_data<T:FromStr + From<i32>>(&self,ind:usize)->T {
        let internal:&Vec<u8> = self.get_internal();
        let mut terminators:Vec<i32> = vec![0];
        let mut string_data:String = String::from("");
        for (index,num) in internal.iter().enumerate() {
            let termination_index:i32 = {
                if ((num == &0u8) || (num >= &100u8) && (num < &200u8)) || (num >= &210u8) || (num == &220u8) {index as i32}
                else {continue}
            };
            terminators.push(termination_index);
        }
        terminators.push((internal.len()) as i32);
        println!("Terminators: {:?}",terminators);
        {
            let digits:&[u8] = {
                let own_terminators:Vec<i32> = terminators;
                let termination_start:usize = (own_terminators[ind] as usize) + 1;
                let termination_end:usize = (own_terminators[ind+1] as usize) + 1;
                println!("Termination start:{termination_start} termination end: {termination_end}");
                let digits:&[u8] = {
                    if (termination_start == 1) && (termination_end == 1) {
                        &internal[..=0]
                    }else {
                        &internal[termination_start..termination_end]
                    }
                };
                digits
            };
            println!("Digits: {:?}",digits);
            for digit in digits {
                string_data += & { 
                    if digit < &100u8 {digit.to_string()}
                    else if (digit > &100u8) && (digit < &200u8)  {(digit-100).to_string()}
                    else if (digit >= &200u8) && (digit < &220u8) {format!("0{}",digit.to_string().chars().last().unwrap())}
                    else if digit == &220u8 {String::from("0")}
                    else {String::from("")}
                }
            };
            let num_to_return:i32 = string_data.parse::<i32>().unwrap();

            let sign = if (num_to_return & 1) != 0 { 1 } else { -1 };
            let number = (num_to_return >> 2) as i32;
            let decoded_num = number * sign;
            
            println!("Decoded number output:   {decoded_num}");
            return T::from(num_to_return);
        }
    }
    fn push<T:Display+ Into<i64>>(&mut self,num:T) {
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
    let cars:Flex = Flex::new::<i32>([0,-1,-2,-3,-4,5,6,7,8,9].to_vec());
    println!("Internal Car re-representation: {:?}",cars.get_internal());
    println!("Number at an index: {}",cars.get_data::<i32>(2));
    // flex_usage::try_flex();
} 

//when its a chunk that starts with zeros its 200 or 220 for one zero only.the one will be read as zero but it means thats the end of the last chunk.220-255 is still left to be utilized