pub mod hello;
pub mod example_one;
pub mod example_two;
pub mod error;
pub mod flex;
pub mod ten;
pub mod closure;
pub mod threads;
pub mod state_2;
pub mod macro_use;

pub mod wireless {
    pub fn wireless() {
        println!("This is a wireless connection")
    }
}
pub mod obj {
    pub trait Movement {
        fn walk(&self);
    }
}
