use std::{fmt::{Debug, Display},str::{Chars, FromStr}, vec};
mod flex_usage;

struct Flex {
    internal:Vec<u8>
}
impl Flex {
    fn new<T:Display +  Into<i64> >(vector:Vec<T>)->Flex  {
        let mut instance:Flex = Self {internal:Vec::new()};
        let mut re_representation:Vec<u8> = vec![];
        for num in vector {instance.encode_num_to_vec(num ,&mut re_representation)}
        instance.internal = re_representation;
        return instance
    }
    fn encode_num_to_vec<T:Display + Into<i64>>(&self,num:T,offload:&mut Vec<u8>) {
        let num:i64 = num.into();
        if num.is_negative() {offload.push(255)}

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
    fn internal(&self)->&Vec<u8> {
        return &self.internal
    }
    fn at<T:FromStr + From<T> + Display>(&self,ind:usize)->T where T::Err :Debug {
        let internal:&Vec<u8> = self.internal();
        let mut internal_signed:Vec<i32> = vec![];

        for (index,element) in internal.iter().enumerate() {
                if element != &255u8 {
                    internal_signed.push(element.to_owned() as i32);
                }else {
                    let y = internal.get(index+1);
                    match y {
                        Some(value)=>{internal_signed.push((value.to_owned() as i32)* -1)},
                        None=>{}
                    }
                }
        }

        let mut terminators:Vec<i32> = vec![0];
        let mut string_data:String = String::from("");
        for (index,num) in internal_signed.iter().enumerate() {
            let termination_index:i32 = {
                if ((num.abs() == 0i32) || (num.abs() >= 100i32) && (num.abs() < 200i32)) || (num.abs() >= 210i32) || (num.abs() == 220i32) {index as i32}
                else {continue}
            };
            terminators.push(termination_index);
        }
        terminators.push((internal_signed.len()) as i32);
        {
            let digits:& [i32] = {
                let own_terminators:Vec<i32> = terminators;
                let mut termination_start:usize = (own_terminators[ind] as usize) + 1;
                if ind == 0 {termination_start = 0;}
                let termination_end:usize = (own_terminators[ind+1] as usize) + 1;
        
                let digits:& [i32] = {
                    if (termination_start == 1) && (termination_end == 1) {& internal_signed[..=0]}
                    else {& internal_signed[termination_start..termination_end]}
                };
                digits
            };
            
            let mut digits:Vec<i32> = digits.to_owned();
            if (digits[0].is_negative()) && (digits.len() > 1)  {
                digits.remove(1);
            }
            
            for digit in &digits {
                string_data += & { 
                    let x = {
                        if digit.abs() < 100i32 {digit.to_string()}
                        else if (digit.abs() > 100i32) && (digit.abs() < 200i32)  {(digit.abs()-100).to_string()}
                        else if (digit.abs() >= 200i32) && (digit.abs() < 220i32) {format!("0{}",digit.abs().to_string().chars().last().unwrap())}
                        else if digit.abs() == 220i32 {String::from("0")}
                        else {String::from("")}
                    };
                    x
                }
            };
            if (digits.len() == 1) && (digits[0].is_negative()){
                string_data = format!("-{string_data}");
            }
            
            let num_to_return:T = {
                let string_data:String = string_data;
                let num_to_return:T = string_data.parse::<T>().unwrap();
                num_to_return
            };
            
            return  num_to_return;
        }
    }
    fn push<T:Display+ Into<i64>>(&mut self,num:T) {
        let mut offload:Vec<u8> = vec![];
        self.encode_num_to_vec(num, &mut offload);
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
    let mut cars:Flex = Flex::new([-17,63,61,64,-900000,897].to_vec());
    println!("Internal Car re-representation: {:?}",cars.internal());
    let x:i32 = cars.at::<i32>(6);//the number of bytes the element you want to retieve takes.Requires head knowledge of which index has which numbe of bytes which isnt possible at runtime so using the biggest byte of the elemensts is preferrable.the vec still takes only the space that it needs for each element but when returning the element,it has to be the biggest size because of lack of runtime predictability
    println!("Number at an index: {}",x);
    cars.push(20);
    cars.clear();
    cars.push(10);
    cars.reset();
    // flex_usage::try_flex();
} 
//Only works down to -63
//when its a chunk that starts with zeros its 200 or 220 for one zero only.the one will be read as zero but it means thats the end of the last chunk.220-255 is still left to be utilized

//Sign information will be lost when using this vector