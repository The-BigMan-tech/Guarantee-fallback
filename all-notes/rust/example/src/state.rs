use software::{App,Level};

mod software {
    pub struct App {
        name:String,
        cpu_usage:Option<Box<dyn ResourceUsage>>,
        memory:i32
    }
    impl App {
        pub fn download(name:String)->App {
            App {
                name,
                cpu_usage:None,
                memory:0
            }
        }
        pub fn name(&self)->&str {
            &self.name
        }
        pub fn cpu_usage(&self)->&Option<Box<dyn ResourceUsage>> {
            &self.cpu_usage
        }
        pub fn in_progress(&self)->Box<dyn ResourceUsage> {
            Box::new(InProgress {})
        }
        pub fn memory(&self)->i32 {
            0
        }
    }
    pub enum Level {
        High,
        Medium,
        Low,
        InProgress
    }
    pub trait ResourceUsage {
        fn update(&self);
        fn concrete(&self)->Level;
    }
    struct High;
    impl ResourceUsage for High {
        fn update(&self) {
            
        }
        fn concrete(&self)->Level {
            Level::High
        }
    }
    struct Medium;
    impl ResourceUsage for Medium {
        fn update(&self) {
            
        }
        fn concrete(&self)->Level {
            Level::Medium
        }
    }
    struct Low;
    impl ResourceUsage for Low {
        fn update(&self) {
            
        }
        fn concrete(&self)->Level {
            Level::Low
        }
    }
    struct InProgress;
    impl ResourceUsage for InProgress {
        fn update(&self) {
            
        }
        fn concrete(&self)->Level {
            Level::InProgress
        }
    }
}

pub fn start() {
    println!("\nHELLO APP\n");

    let antivirus: App = App::download(String::from("ms antivirus"));
    let usage: Level = match antivirus.cpu_usage() {
        Some(usage)=>usage.as_ref().concrete(),
        None=>antivirus.in_progress().concrete()
    };
    match usage {
        Level::High=>println!("High cpu usage"),
        Level::Medium=>println!("medium cpu usage"),
        Level::Low=>println!("low cpu usage"),
        Level::InProgress=>println!("calculting cpu usage")
    }
    let memory_usage: i32 = antivirus.memory();
    println!("The name of the software is: {}",antivirus.name());
    println!("Memory usage: {memory_usage} gb")
}