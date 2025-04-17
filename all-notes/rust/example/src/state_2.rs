pub mod two{
    pub fn start_two() {
        use device::*;
        mod device {
            use std::fmt::Debug;
            use std::io::{self, Write};
            #[derive(Clone,Debug)]
            pub struct Device{
                pub name:String,
                pub cpu:CPU,
                memory:u16,//read by the cpu
                memory_usage:u16,//managed by the cpu
                battery:u8,
                settings:Settings,//modified only through the device methods
            }
            #[derive(Clone,Debug)]
            pub struct CPU {
                cpu_usage:UsageLevel
            }
            #[derive(Clone,Debug)]
            pub struct Settings {
                brightness:i32,
                root:bool,
            }
            impl Device {//directly modifies
                pub fn new(name:String,cpu:Option<CPU>)->Device{
                    Device { 
                        name:name, 
                        memory:4000,
                        memory_usage:0,
                        battery:100,
                        cpu:cpu.unwrap_or(CPU::new()),
                        settings:Settings::new()
                    }
                }
                pub fn change_memory_usage(&mut self,number:u16) {
                    self.memory_usage = number;
                }
                pub fn settings(&self)->&Settings {
                    &self.settings
                }
                pub fn increase_brightness(&mut self) {
                    self.settings.brightness += 1;
                }
                pub fn try_enable_root(&self)->Result<Device,String> {
                    if self.battery < 20 {
                        return Err("Battery is too low to enable root".to_string())
                    }
                    let mut new_device: Device = self.to_owned();
                    new_device.settings.root = true;
                    Ok(new_device)
                }
            }
            impl CPU {//partially a state machine.doesnt modify the device but it modifies itself.
                pub fn new()->CPU {
                    CPU { 
                        cpu_usage:UsageLevel::Zero
                    }
                }
                pub fn increase_memory_usage(&self,device:&Device)->Result<u16,u16> {
                    if device.memory_usage < device.memory {
                        Ok(device.memory_usage + 100)
                    }else {
                        Err(device.memory_usage)
                    }
                }
                pub fn increase_cpu_usage(&mut self) {
                    self.cpu_usage = self.cpu_usage.increase_res_usage();
                }
                pub fn cpu_usage(&self)->&UsageLevel {
                    &self.cpu_usage
                }
            }
            impl Settings {
                pub fn new()->Settings {
                    Settings { brightness:10, root:false }
                }
            }
            pub trait SettingsProps {
                fn brightness(&self)->i32;
                fn root(&self)->bool;
            }
            impl SettingsProps for &Settings {
                fn brightness(&self)->i32 {
                    self.brightness
                }
                fn root(&self)->bool {
                    self.root
                }
            }
            #[derive(Debug,Clone)]
            pub enum UsageLevel {
                High,
                Medium,
                Low,
                Zero,
            }
            impl UsageLevel {
                fn increase_res_usage(&self) -> UsageLevel {
                    match self {
                        UsageLevel::High => self.clone(),
                        UsageLevel::Medium => UsageLevel::High,
                        UsageLevel::Low => UsageLevel::Medium,
                        UsageLevel::Zero => UsageLevel::Low,
                    }
                }
            }
            pub fn confirm_action() -> bool {
                print!("Are you sure you want to enable root access? (y/n): ");
                io::stdout().flush().unwrap(); // Ensure the prompt is displayed
                let mut input: String = String::new();
                io::stdin().read_line(&mut input).unwrap();
                input.trim().eq_ignore_ascii_case("y")
            }
        }
        println!("\nTEST 2:\n");

        let mut dell:Device = Device::new(String::from("dells laptop"),None);
        let new_mem_usage: Result<_, _> = dell.cpu.increase_memory_usage(&dell);
        match new_mem_usage {
            Ok(value)=>dell.change_memory_usage(value),
            Err(value)=>{
                println!("Not enough memory,application may be slower");
                dell.change_memory_usage(value)
            },
        }
        dell.increase_brightness();

        println!("Name: {}",dell.name);
        println!("Brightness: {}",dell.settings().brightness());
        println!("Has root access: {}",dell.settings().root());//false

        let new_device: Device = dell.try_enable_root().unwrap();//dell isnt affected cuz only the new instace is rooted

        if confirm_action() {
            let old_device: Device = dell.to_owned();
            dell = new_device; // Proceed with the change
            //code can only use the old device in this block where it hasnt been dropped
            println!("Old Device:Has root access: {}",old_device.settings().root())//false.
        } else {
            {new_device};
            println!("Operation cancelled. Old device state preserved.");
        }
        println!("Has root access: {}",dell.settings().root());//true
        dell.cpu.increase_cpu_usage();
        println!("CPU Usage: {:?}",dell.cpu.cpu_usage());

        println!("Device: {:?}",dell);
    }
}