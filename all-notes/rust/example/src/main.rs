mod hello;
mod example_one;
mod example_two;
mod error;
mod flex;
mod ten;
mod closure;

use std::collections::HashMap;
use error::question_mark;
fn main() {
    // example_two::example_two();
    // hello::hello();

    let mut stats:Vec<i32> = Vec::new();
    stats.push(10);
    println!("{}",stats.get(0).unwrap_or(&0));//*This line
    let first = &stats[0];
    println!("The first stat from the stats variable: {first}");

    let one:&Vec<i32> = &stats;
    println!("The first stats from the one variable: {}",one[0]);

    fn safely_access(vector:&Vec<i32>,index:usize)->&i32 {//*This block are the same execpt that the first is shorter */
        let Option::Some(element) = vector.get(index) else {
            return &0
        };
        return element;
    }
    let first_element = safely_access(&stats,1);
    println!("The first stat after using the get method: {first_element}");

    let mut cart:Vec<i32> = vec![1,8];
    cart.push(9);
    let first_item:&i32 = &cart[0];
    println!("The first element is: {first_item}");

    let mut v = vec![100, 32, 57];
    for i in &mut v {
        *i += 50;
    };
    let mut sentence: String = String::from("I like dogs");
    let end:&str = "jj";
    sentence.push_str(end);
    println!("{sentence} END: {end}");

    let mut sentence2:String = String::from("I like cats");
    let sentence3:String = sentence + " "+  &sentence2;
    println!("{sentence3}");
    sentence2 = String::from("I like fish");
    println!("{sentence2}");

    let sentence4:String = format!("{sentence2} and {sentence3}");
    println!("Sentence 4: {sentence4}");

    let rabbit:String = String::from("😃catsanddogs");
    let slice:&str = &rabbit[0..4];
    println!("{slice}");

    for (index,character) in rabbit.chars().enumerate() {
        println!("Index:{index}, Character: {character}")
    };
    let pizza:String = String::from("pizza");
    let pizza_comment:String = String::from("Pizza is good");

    let mut foodmap:HashMap<String,String> = HashMap::new();
    foodmap.insert(String::from("burger"),String::from("I enjoy burger"));
    foodmap.insert(pizza, pizza_comment);

    fn print_burger(foodmap:&HashMap<String,String>) {
        let default_value:String = String::from("");
        let ref_burger_price:&String = foodmap.get("burger").unwrap_or(&default_value);
        println!("Burger price: {ref_burger_price}");
    }
    print_burger(&foodmap);
    foodmap.entry(String::from("hotdog")).or_insert(String::from("I love hotdogs"));
    foodmap.entry(String::from("hotdog")).or_insert(String::from(""));
    println!("Food map for hotdog: {}",foodmap.get("hotdog").unwrap());

    for (key,val) in &foodmap {
        println!("Key: {key},Value: {val}")
    };
    let mut w:i32 = 10;
    let s:&mut i32 = &mut w;
    *s += 2;
    *s += 1;
    w += 1;
    let u:&i32 = &w;
    // w += 1;This will lead to unexpected behaviour if it did compile
    let w:i32 = w + 1 ;

    println!("W value {w},U value: {u}");

    let mut num_vec:Vec<i32> = vec![1];
    let c:&mut i32 = &mut num_vec[0];
    *c += 1;
    println!("{}",num_vec[0]);

    let mut x:String = String::from("ddd");
    let z:&mut String = &mut x;
    println!("Z value: {}",*z);

    let y:&String = &x;
    println!("y value: {y}");

    
    let text:&str = "hello world wonderful world";
    let mut map:HashMap<&str, i32> = HashMap::new();

    for word in text.split_whitespace() {
        let count:&mut i32 = map.entry(word).or_insert(0);
        *count += 1;
    }
    println!("{map:?}");
    let result: Result<i32, String> = question_mark();
    println!("Result: {}",result.unwrap());

    flex::flex();
    ten::ten();
    closure::close();
    closure::smart();

}