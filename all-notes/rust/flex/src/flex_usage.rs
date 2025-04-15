use std::{any::type_name,mem};
use crate::Flex;

fn _print_vector_type<T>(_vec: &Vec<T>) {
    println!("The type of the vector is: {}", type_name::<T>());
}
fn bytes<T>(vec:&Vec<T>)->usize {
    return vec.len() * mem::size_of::<T>();
}
pub fn try_flex() {
    let shoes: Vec<i32> = vec![1234,20,901,43,90090000,23885,900,9899,8876,8,7,8];
    println!("Original bytes:{}",bytes(&shoes));

    let mut flex_shoes:Flex = Flex::new(shoes);
    println!("Number of bytes of flexible vector:{}",bytes(&flex_shoes.internal));

    let re_rep:&Vec<u8> = flex_shoes.get_internal();
    let test_data:i64 = flex_shoes.get_data::<i64>(11);

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
    println!("at 0: {}",flex_stats.get_data::<i64>(0));
}