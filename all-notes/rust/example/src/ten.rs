mod property {
    pub trait Info {
        fn return_info(&self)->String;
        fn return_class(&self)->String {
            return String::from("This object is a property")
        }
    }
    pub trait Market {
        fn sell(&self)->String;
        fn re_sell(&self)->String {
            return self.sell();
        }
    }
}
mod boat {
    use super::{Info,Market};
    pub struct Boat {
        pub price:i32
    }
    impl Info for Boat {
        fn return_info(&self)->String {
            let price = self.price;
            return format!("I am a boat of price: {price}")
        }
    }
    impl Market for Boat {
        fn sell(&self)->String {
            return format!("You have sold this for ${}",self.price)
        }
    }
}
mod house{
    use std::fmt::Display;
    use super::Info;
    pub struct House<T> {
        price:T,
        has_bought:bool
    }
    impl<T> House<T> {
        pub fn new(price:T,has_bought:bool)->House<T> {
            return House {
                price,
                has_bought
            }
        }
        pub fn return_price(&self)-> &T {
            return &self.price
        }
        pub fn get_has_bought(&self)->&bool {
            return &self.has_bought
        }
    }
    impl<T:Display> Info for House<T> {
        fn return_info(&self)->String {
            return format!("I am a house of price: {}",self.price)
        }
    }
}
use house::House;
use boat::Boat;
use property::{Info,Market};

fn report_info(property:&impl Info) {
    println!("Report: {}",property.return_info());
}
fn return_str<'long>(y:&'long str,z:&'long str)->&'long str {
        return y;
}
pub fn ten() {
    println!("Hello Ten");
    let bungalow:House<i32> = House::new(10, true);
    println!("Price: {},Has bought: {}",bungalow.return_price(),bungalow.get_has_bought());

    let canoe:Boat = Boat {price:20};
    println!("{}",canoe.return_info());
    println!("{}",bungalow.return_info());
    println!("Class: {}",canoe.return_class());
    println!("Sell info: {}",canoe.sell());
    println!("Resell info: {}",canoe.re_sell());
    report_info(&bungalow);

    let _estate:House<Vec<i32>> = House::new(vec![111], false);
    // println!("Attempted to return info: {}",estate.return_info()) 
    println!("String return: {}",return_str("hello","jj"));
    let xy: &str = "aa";
    {
        let yz: &str = "uu";
        let ab: &str = return_str(xy, yz);
        println!("{ab}")
    }
    let vec = vec![1, 2, 3];
    
    // We can take ownership of the vector using into_iter()
    for item in vec {
        println!("{}", item);
    }
}