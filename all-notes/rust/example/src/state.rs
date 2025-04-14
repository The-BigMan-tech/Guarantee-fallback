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
    use std::cell::RefCell;
    pub fn start_two() {
        use std::cell::RefMut;
        use device::*;
        mod device {
            use std::cell::RefMut;
            use super::RefCell;
            pub struct Device<'device_life> {
                pub name:String,
                pub cpu:CPU<'device_life>
            }
            pub struct CPU<'device_life> {
                pub memory:i32,
                pub device:Option<&'device_life RefCell<Device<'device_life>>>,
            }
            impl<'device_life> Device<'device_life> {
                pub fn new(name:String,cpu:Option<CPU<'device_life>>)->Device<'device_life> {
                    Device { 
                        name:name, 
                        cpu:cpu.unwrap_or(CPU::new())
                    }
                }
            }
            impl <'device_life> CPU<'device_life> {
                pub fn new()->CPU<'device_life> {
                    CPU { 
                        memory:4000, 
                        device:None,
                    }
                }
            }
            pub trait DeviceFunctions<'device_life,'scope> {
                fn integrate_components(&'device_life self,mutable:RefMut<'scope, Device<'device_life>>)->RefMut<'scope, Device<'device_life>>;
                fn key(&self,mutable:RefMut<'scope, Device<'device_life>>)->RefMut<'scope, Device<'device_life>>;
            }
            impl<'device_life,'scope> DeviceFunctions<'device_life,'scope> for RefCell<Device<'device_life>> {
                fn integrate_components(&'device_life self,mut mutable:RefMut<'scope, Device<'device_life>>)->RefMut<'scope, Device<'device_life>> {
                    mutable.cpu.device = Some(self);
                    mutable
                }
                fn key(&self,mutable:RefMut<'scope, Device<'device_life>>)->RefMut<'scope, Device<'device_life>> {
                    mutable
                }
            }
        }
        println!("\nTEST 2:\n");
        let dell:RefCell<Device<'_>> = RefCell::new(Device::new(String::from("dells laptop"),None));
        dell.integrate_components(dell.borrow_mut());

        println!("Device name: {}",dell.borrow().name);
        println!("Device memory: {}",dell.borrow().cpu.memory);

        dell.borrow_mut().name = "ss".to_string();

        let device_key: RefMut<'_, Device<'_>> = dell.borrow_mut();
        device_key.cpu.device.unwrap().key(device_key).name = "a".to_string();

        println!("Device memory: {}",dell.borrow().cpu.memory);
        println!("Device name: {}",dell.borrow().name);

        let device_key: RefMut<'_, Device<'_>> = dell.borrow_mut();
        println!("Device name: {}",device_key.cpu.device.unwrap().key(device_key).name);
    }
}