fn hello(name:&str,age:i32)->&str {
    println!("Hello {}.Your age is {}",name,age);
    if age > 0 {
        return "Your age is greater than 0";
    }else if age == -1 {
        return  "Your age is -1";
    }
    return "Your age is very negative"
}

fn main() {
    let food:&str = "noodles";//*string literal */
    let mut juice:&str = "ribena";
    println!("Here is my food: {} and my juice {}",food,juice);
    juice = "active";
    println!("{}",juice);

    let cash:i8 = 1;
    println!("Cash 1: {}",cash);
    let cash:i8 = cash + 1;
    println!("Cash 2: {}",cash);

    let frequencies:[i32;4] = [1,2,3,4];
    let months:[i32;6] = [1;6];
    println!("frequencies {:?} months:{:?}",frequencies,months);
    let echo:&str = hello("Person",-11);
    println!("echo: {}",echo);

    let val = 10;
    let val = if val > 0 {val} else {0};
    println!("Here is the value of val: {}",val);

    let mut x:i32 = 10;
    let result:i32 = loop {
        if x < 20 {
            x += 1;
            println!("Current value of x: {}",x)
        }else {
            break x
        }
    };
    println!("Final result: {}",result);

    let mut y:i32 = 0;
    while y < 5 {
        println!("Current value of y: {}",y);
        y += 1;
    }
    let nums:[i32;5] = [1,2,3,4,5];
    for num in nums {
        println!("loop1:Number: {}",num)
    }
    for num in [1;5] {
        println!("loop 2:Number: {}",num)
    }
    for num in 1..4 {
        println!("loop3:Number: {}",num)
    };
    {
        let mut c:String = String::from("Hello world");//*string object */
    }
    
}
