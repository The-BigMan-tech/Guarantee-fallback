use std::fmt;
mod hello;
mod example_one;
fn main() {
    struct User<'long> {
        username:&'long str,
        password:&'long str,
        active:bool
    }
    let user1:User = User {
        username:"Paul1234",
        password:"Lame1234",
        active:true
    };
    let user2:User = User {
        username:"John1245",
        ..user1
    };
    println!("Your username is {} and your password is {} and your active status is :{}",user1.username,user1.password,user1.active);
    println!("Your second username is {} and your password is {} and your active status is :{}",user2.username,user2.password,user2.active);

    struct Mob {
        name:String,
        damage:i32
    }
    let creeper:Mob = Mob {
        name:String::from("Creeper"),
        damage:12
    };
    let spider:Mob = Mob {
        name:String::from("Spider"),
        ..creeper
    };
    println!("Here is the mob\'s name: {} and damage {}",creeper.name,creeper.damage);
    println!("Here is the second mob\'s name: {} and damage {}",spider.name,spider.damage);

    struct  Numbers(i32,i32);
    let one:Numbers = Numbers(1,2);
    println!("Numbers are {} and {}",one.0,one.1);

    struct Point {
        x_axis:i32,
        y_axis:i32
    }
    impl Point {
        fn new (x:i32,y:i32)->Self {
            return Self {
                x_axis:x,
                y_axis:y
            }
        }
        fn log_cords(&self) {
            println!("Cords are {} and {}",self.x_axis,self.y_axis);
        }
    }
    let point1:Point = Point {x_axis:20,y_axis:1};
    point1.log_cords();
    let point2:Point = Point::new(13,129);
    point2.log_cords();

    enum MoneyValue {
        Cheap(i32),
        Expensive(i32),
        Custom{value:i32}
    }
    impl fmt::Display for MoneyValue {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            MoneyValue::Cheap(value) | MoneyValue::Custom{value} | MoneyValue::Expensive(value) => {
                write!(f,"{}",value)
            }
        }
    }
}
    let gold:MoneyValue = MoneyValue::Expensive(8);
    let wood:MoneyValue = MoneyValue::Cheap(15);
    let something:MoneyValue = MoneyValue::Custom { value: 13 };
    println!("Gold is {} and wood is {} and something is {}",gold,wood,something);
    
    let some:Option<i32> = Some(10);
    let some2:Option<i32> = None;
    
    fn handle_for_null_data(data:Option<i32>)->i32 {
        match data {
            Option::Some(value) => value,
            Option::None => 0
        }
    }
    println!("Handled null data for some1: {}",handle_for_null_data(some));
    println!("Handled null data for some2: {}",handle_for_null_data(some2));

    enum AuthEnum {
        Authorized,
        Unauthorized,
        Pending
    }
    struct Gamer {
        username:String,
        auth_state:AuthEnum
    }
    fn check_for_auth(user:AuthEnum)->String {
        match user {
            AuthEnum::Authorized => String::from("Authorized"),
            AuthEnum::Unauthorized =>String::from("Unauthorized"),
            _=>String::from("Pending")
        }
    }
    let gamer1:Gamer = Gamer {
        username:String::from("Paul1234"),
        auth_state:AuthEnum::Authorized
    };
    let gamer2:Gamer = Gamer {
        username:String::from("Poke1234"),
        auth_state:AuthEnum::Unauthorized
    };
    let gamer3:Gamer = Gamer {
        username:String::from("Poke1234"),
        auth_state:AuthEnum::Pending
    };
    println!("The gamer: {} is {}",gamer1.username,check_for_auth(gamer1.auth_state));
    println!("The gamer: {} is {}",gamer2.username,check_for_auth(gamer2.auth_state));
    println!("The gamer: {} is {}",gamer3.username,check_for_auth(gamer3.auth_state));

    let choice:Option<bool> = None;
    match choice {
        Option::Some(true)=>println!("The choice is yes"),
        Option::Some(false)=>println!("The choice is no"),
        Option::None=>println!("The user hasnt yet made his choice")
    }
    match choice {
        Option::Some(value)=>println!("The choice is {}",value),
        _=>println!("The user hasnt yet made his choice")
    }
    if let Option::Some(value) = choice {
        println!("The choice is {}",value);
    }else {
        println!("The user hasnt yet made his choice")
    };
    fn return_choice(choice:Option<bool>)->bool {
        let Option::Some(_state) = choice else {
            return false
        };
        // return state;
        let value = if let Option::Some(state) = choice {
            println!("The choice is {}",state);
            state
        }else {
            println!("The user hasnt yet made his choice");
            false
        };
        return value
    }
    println!("The final value of the state is: {}",return_choice(choice));
    hello::hello();
    // example_one::example()
}