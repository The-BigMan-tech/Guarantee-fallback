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
        Expensive(i32)
    }
    let gold:MoneyValue = MoneyValue::Expensive(8);
    let wood:MoneyValue = MoneyValue::Cheap(15);
}