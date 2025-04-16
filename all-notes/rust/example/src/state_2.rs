use cpu::{CPU,UsageLevel};
use device::Device;

mod device {
    use super::cpu::CPU;

    #[derive(Debug)]
    pub struct Device<'device> {
        total_ram:i32,
        ram_in_use:i32,
        pub cpu:CPU<'device>
    }
    impl<'device> Device<'device> {
        pub fn new(cpu:CPU<'device>)->Device<'device> {
            Device { 
                total_ram:4000, 
                ram_in_use:0, 
                cpu
            }
        }
        pub fn total_ram(&self)->i32 {self.total_ram}
        pub fn ram_in_use(&mut self)->&mut i32{&mut self.ram_in_use}
    }
}
mod cpu {
    use super::device::Device;

    #[derive(Debug)]
    pub struct CPU<'device> {
        ram_usage:Option<Box<dyn ResourceUsage>>,
        pub device:Option<&'device mut Device<'device>>
    }
    impl<'device> CPU<'device> {
        pub fn new(device:Option<&'device mut Device<'device>>)->CPU<'device> {
            let cpu = CPU {
                ram_usage:Some(Box::new(Zero{})),
                device
            };
            cpu
        }
        pub fn ram_usage(&self)->&Option<Box<dyn ResourceUsage>> {
            &self.ram_usage
        }
        pub fn increase_ram_usage(&mut self) {
            if let Some(usage) = self.ram_usage.take() {
                //bad one
                let ram_in_use = self.device.as_mut().unwrap().ram_in_use();
                self.ram_usage = Some(usage.increase_res_usage());
                *ram_in_use = self.ram_usage.as_ref().unwrap().ram_in_use(*ram_in_use);
            }
        }
    }
    pub trait ResourceUsage:std::fmt::Debug {
        fn concrete(&self)->UsageLevel;
        fn ram_in_use(&self,_memory_used:i32)->i32 {0}
        fn increase_res_usage(self:Box<Self>)->Box<dyn ResourceUsage>;
    }
    pub enum UsageLevel {
        High,
        Medium,
        Low,
        Zero,
    }
    #[derive(Debug)]
    struct High;
    impl ResourceUsage for High {
        fn concrete(&self)->UsageLevel {
            UsageLevel::High
        }
        fn increase_res_usage(self:Box<Self>)->Box<dyn ResourceUsage> {
            self
        }
        fn ram_in_use(&self,memory_used:i32)->i32 {
            memory_used + 1000
        }
    }
    #[derive(Debug)]
    struct Medium;
    impl ResourceUsage for Medium {
        fn concrete(&self)->UsageLevel {
            UsageLevel::Medium
        }
        fn increase_res_usage(self:Box<Self>)->Box<dyn ResourceUsage> {
            Box::new(High{})
        }
        fn ram_in_use(&self,memory_used:i32)->i32 {
            memory_used + 500
        }
    }
    #[derive(Debug)]
    struct Low;
    impl ResourceUsage for Low {
        fn concrete(&self)->UsageLevel {
            UsageLevel::Low
        }
        fn increase_res_usage(self:Box<Self>)->Box<dyn ResourceUsage> {
            Box::new(Medium{})
        }
        fn ram_in_use(&self,memory_used:i32)->i32 {
            memory_used + 100
        }
    }
    #[derive(Debug)]
    struct Zero;
    impl ResourceUsage for Zero {
        fn concrete(&self)->UsageLevel {
            UsageLevel::Zero
        }
        fn increase_res_usage(self:Box<Self>)->Box<dyn ResourceUsage> {
            Box::new(Low{})
        }
    }
}

pub fn start() {
    println!("\nHELLO APP\n");

    let cpu: CPU<'_> = CPU::new(None);
    let mut tecno: Device = Device::new(cpu);

    let mut y = Device::new(CPU::new(None));
    tecno.cpu.device = Some(&mut y);

    tecno.cpu.increase_ram_usage();
    tecno.cpu.increase_ram_usage();

    let usage:UsageLevel = tecno.cpu.ram_usage().as_ref().unwrap().concrete();
    match usage {
        UsageLevel::High=>println!("High cpu usage"),
        UsageLevel::Medium=>println!("Medium cpu usage"),
        UsageLevel::Low=>println!("Low cpu usage"),
        UsageLevel::Zero=>println!("No cpu usage"),
    }
    println!("Device memory in use: {}",tecno.ram_in_use());
    println!("Tecno: {tecno:?}");
}
pub mod two{
    pub fn start_two() {
        use device::*;
        #[macro_use]
        mod device {
            pub struct Device {
                pub name:String,
                pub battery:u8,
                pub cpu:CPU
            }
            pub struct CPU {
                pub memory:i32,
            }
            impl Device {
                pub fn new(name:String,cpu:Option<CPU>)->Device {
                    Device { 
                        name:name, 
                        battery:100,
                        cpu:cpu.unwrap_or(CPU::new())
                    }
                }
            }
            impl CPU {
                pub fn new()->CPU {
                    CPU { 
                        memory:4000, 
                    }
                }
                pub fn change_battery(&self,device:&Device)->u8 {
                    if self.memory >= 4000 {
                        device.battery + 100
                    }else {
                        device.battery
                    }
                }
            }
        }
        println!("\nTEST 2:\n");
        let mut dell:Device = Device::new(String::from("dells laptop"),None);
        println!("Device name: {}",dell.name);
        dell.battery = dell.cpu.change_battery(&dell);
        println!("Device battery: {}",dell.battery);
    }
}