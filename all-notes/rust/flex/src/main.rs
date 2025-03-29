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
        let num_as_string:String = num.abs().to_string();
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
        {
            let digits:&[u8] = {
                let own_terminators:Vec<i32> = terminators;
                let mut termination_start:usize = (own_terminators[ind] as usize) + 1;
                if ind == 0 {termination_start = 0;}
                let termination_end:usize = (own_terminators[ind+1] as usize) + 1;
                println!("Termination start: {termination_start}, End: {termination_end}");
                let digits:&[u8] = {
                    if (termination_start == 1) && (termination_end == 1) {&internal[..=0]}
                    else {&internal[termination_start..termination_end]}
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
            let num_to_return:i32 = {
                let string_data:String = string_data;
                let num_to_return:i32 = string_data.parse::<i32>().unwrap();
                num_to_return
            };
            println!("Num to return: {num_to_return}");
            return  T::from(num_to_return);
        }
    }
    fn push<T:Display+ Into<i64>>(&mut self,num:T) {
        let mut offload:Vec<u8> = vec![];
        self.create_representation(num, &mut offload);
        self.internal.append(&mut offload);
    }
    fn clear(&mut self) {
        self.internal.clear();
    }
    fn reset(&mut self) {
        self.internal = vec![]
    }
}
fn main() {
    let mut cars:Flex = Flex::new([-1,63,61,64,-9000000].to_vec());
    println!("Internal Car re-representation: {:?}",cars.get_internal());
    println!("Number at an index: {}",cars.get_data::<i32>(0));
    cars.push(20);
    cars.clear();
    cars.push(10);
    cars.reset();
    // flex_usage::try_flex();
} 
//Only works down to -63
//when its a chunk that starts with zeros its 200 or 220 for one zero only.the one will be read as zero but it means thats the end of the last chunk.220-255 is still left to be utilized

//Sign information will be lost when using this vector