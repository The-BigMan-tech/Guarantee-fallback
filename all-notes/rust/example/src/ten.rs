pub trait Info {
    fn return_info(&self)->String;
}
mod boat {
    use super::Info;
    pub struct Boat {
        pub price:i32
    }
    impl Info for Boat {
        fn return_info(&self)->String {
            let price = self.price;
            return format!("I am a boat of price: {price}")
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

pub fn ten() {
    println!("Hello Ten");
    let bungalow:House<i32> = House::new(10, true);
    println!("Price: {},Has bought: {}",bungalow.return_price(),bungalow.get_has_bought());

    let canoe:Boat = Boat {price:20};
    println!("{}",canoe.return_info());
    println!("{}",bungalow.return_info())
}