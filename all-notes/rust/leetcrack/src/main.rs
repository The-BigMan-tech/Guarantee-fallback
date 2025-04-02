fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
    let mut output:Vec<i32> = vec![];
    let nums_ref: &Vec<i32> = &nums;
    for (index,num) in nums_ref.iter().enumerate() {
        if output.is_empty() {
            for (index_2,num_2) in nums_ref.iter().enumerate() {
                if index == index_2 {
                    continue
                }
                else if (num + num_2) == target {
                    output.push(index as i32);
                    output.push(index_2 as i32);
                }
            }
        }else {
            break
        }
    }
    return output;
}
fn is_palindrome(x: i32) -> bool {
    let num_str: String = x.to_string();
    let reversed: String = num_str.chars().rev().collect();
    if num_str == reversed {return true}
    return false
}
pub fn longest_common_prefix(strs: Vec<String>) -> String {
    for string in &strs {
        for string_2 in &strs {
            if string.as_str().starts_with([]) {

            }
        }
    };
    return String::from("");
}
fn main() {
    println!("Hello, world!");
    let v:Vec<i32> = vec![3,2,3,5,9,88,8];
    let result: Vec<i32> = two_sum(v,90);
    println!("Result: {:?}",result);
    println!("Is pali:{}",is_palindrome(121));
    let str_vector: Vec<String> = vec!["flower","fly","soccer"].iter().map(|element|element.to_string()).collect();
    println!("Longest common prefix: {}",longest_common_prefix(str_vector));

    let r = String::from("kk");
    println!("{r}");
    let y = 10;
    let v = vec!["jj"];
    let g:Vec<String> = v.into();
    println!("{:?}",v)
}
