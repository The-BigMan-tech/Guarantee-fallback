use software::{App,ResourceUsage};

mod software {
    pub struct App {
        name:String,
        cpu_usage:Option<Box<dyn ResourceUsage>>
    }
    impl App {
        pub fn new(name:String)->App {
            App {
                name,
                cpu_usage:Some(Box::new(Low))
            }
        }
        pub fn name(&self)->&String {
            &self.name
        }
        pub fn cpu_usage(&self)->&Option<Box<dyn ResourceUsage>> {
            &self.cpu_usage
        }
    }
    pub trait ResourceUsage {
        fn update(&self);
    }
    struct High;
    impl ResourceUsage for High {
        fn update(&self) {
            
        }
    }
    struct Medium;
    impl ResourceUsage for Medium {
        fn update(&self) {
            
        }
    }
    struct Low;
    impl ResourceUsage for Low {
        fn update(&self) {
            
        }
    }
}

pub fn start() {
    let antivirus: App = App::new(String::from("ms antivirus"));
    let usage: Box<dyn ResourceUsage> = antivirus.cpu_usage().unwrap();

    println!("The name of the software is: {}",antivirus.name());
}