fn main() {
    println!("Hello, world!");
    
    unsafe fn danger() {
        let mut number: i32 = 5;
        let x: *const i32 = &raw const number;
        let y:*mut i32 = &raw mut number;
        println!("The value of x: {}",*x);
        println!("The value of x: {}",*y);
    }
    unsafe {
        danger();
    }
    use std::slice;
    fn split_at_mut(values: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
        let len: usize = values.len();
        let ptr: *mut i32 = values.as_mut_ptr();
        assert!(mid <= len);
        unsafe {
            let slice_1: &mut [i32] = slice::from_raw_parts_mut(ptr, mid);
            let slice_2: &mut [i32] = slice::from_raw_parts_mut(ptr.add(mid), len - mid);
            (slice_1,slice_2)
        }
    }
    let mut v: Vec<i32> = vec![1, 2, 3, 4, 5, 6];
    let r: &mut [i32] = &mut v[..];

    let (a, b) = split_at_mut(r,3);
    assert_eq!(a, &mut [1, 2, 3]);
    assert_eq!(b, &mut [4, 5, 6]);

    static mut COUNTER:u32  = 0;
    unsafe {
        let counter: *mut u32 = &raw mut COUNTER;
        *counter += 1;
        println!("Counter: {}",*counter);
    }
    unsafe {
        let mut num: Box<i32> = Box::new(0);
        let x: *const Box<i32> = &raw const num;
        let y: *mut Box<i32> = &raw mut num;
        **y += 1;
        println!("X: {}",*x);
        println!("Y: {}",*y);
    }
    unsafe {
        use device::Device;
        mod device  {
            #[derive(Debug)]
            pub struct Device {
                _name:String,
                pub _wifi:i32,
                pub num:i32,
                _password:i32,
                pub _friend:String
            }
            impl Device {
                pub fn new()->Device {
                    Device { _name:String::from("Tecno"), _password:1234,num:99,_wifi:19,_friend:String::from("sss")}
                }
            }
        }
        let a: Device = Device::new();

        let a_pointer: *const String = &raw const a as *const String;
        let a_friend: *const String = &raw const a._friend;
        let y: *const String = a_pointer.byte_offset(4);
        let x: *const i32 = a_pointer.byte_offset(32) as *const i32;
        
        let b: *const i32 = &raw const a.num;
        let c: *const i32 = b.byte_offset(4);

        println!("A Pointer: {a_pointer:?} A Friend: {a_friend:?} Y Pointer: {y:?} B: {b:?} C: {c:?} X: {x:?}");//memory addresses of the pointers
        println!("Value at c: {} and x: {:?}",*c,*x);//This is the password thats supposed to be private.
        println!("Value at the a pointer: {:?}",*a_pointer);
    }
}
