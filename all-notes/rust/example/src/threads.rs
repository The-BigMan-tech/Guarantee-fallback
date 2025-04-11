use std::{sync::{mpsc, Arc, Mutex, MutexGuard}, thread::{self, JoinHandle}, time::Duration};
use tokio_stream::StreamExt;
use tokio::{self,task::JoinHandle as TokioHandle};
use bytes::{BufMut, Bytes, BytesMut};

pub fn thread() {
    println!("\nHello threads!!");
    let (tx,rx) = mpsc::channel();
    let tx_1: mpsc::Sender<String> = tx.clone();
    let name: String = String::from("john");
    let handler:JoinHandle<()> = thread::spawn(move || {
        for i in 1..20 {
            println!("Value of i: {i}");
            println!("String {name}");
        }
        let person: String = String::from("person1");
        tx.send(person).unwrap();
    });
    let handler_2: JoinHandle<()> = thread::spawn(move || {
        thread::sleep(Duration::from_millis(20));
        let person_2: String = String::from("person2");
        tx_1.send(person_2).unwrap();
    });
    handler.join().unwrap();
    handler_2.join().unwrap();
    let person: String = rx.recv().unwrap();
    println!("Received person 1: {person}");

    let person_2: String = rx.recv().unwrap();
    println!("Received person 2: {person_2}");

    let mute: Arc<Mutex<i32>> = Arc::new(Mutex::new(10));
    {
        let number:MutexGuard<'_, i32> = mute.lock().unwrap();
        println!("number: {number}");
    }
    let mut handles: Vec<JoinHandle<()>> = vec![];
    for _ in 0..10 {
        let mute_owner: Arc<Mutex<i32>> = Arc::clone(&mute);
        let handle: JoinHandle<()> = thread::spawn(move || {
            let mut num: MutexGuard<'_, i32> = mute_owner.lock().unwrap();
            *num += 1;
            println!("number value: {num}");
        });
        handles.push(handle);
    }
    for handle in handles {
        handle.join().unwrap();
    }
    println!("End of main thread");
}

pub async fn asyn() {
    println!("\nHello async!!\n");
    async fn hello(name:&String) {
        println!("Hello {name}");
    }
    let name: String = String::from("name1");
    hello(&name).await;
    async fn fetch() {
        println!("fetching data from file");
        let name_2: String = String::from("name2");
        let task: TokioHandle<()> = tokio::spawn(async move {
            hello(&name_2).await;
        });
        task.await.unwrap();
    }
    tokio::spawn(fetch());
    fetch().await;
    let number: Arc<Mutex<i32>> = Arc::new(Mutex::new(0));
    let num: Arc<Mutex<i32>> = Arc::clone(&number);
    let num_1: Arc<Mutex<i32>> = Arc::clone(&number);
    async fn print_num(num:Arc<Mutex<i32>>)->i32 {
        println!("Processing num from async func: {}",num.lock().unwrap());
        10
    }
    async fn print_number() {
        println!("ten men");
    }
    let print_num_2 = async move {
        let num_from_pointer:i32;
        {
            let mut num_pointer: MutexGuard<'_, i32> = num.lock().unwrap();
            *num_pointer = 11;
            num_from_pointer = *num_pointer;
        }
        print_number().await;
        println!("Processing number {}",num_from_pointer);
        6
    };
    let print_2_result: i32 = print_num_2.await;
    println!("Here is print 2 result: {}",print_2_result);
    // tokio::spawn(print_num_2);
    let task_2: TokioHandle<i32> = tokio::spawn(print_num(num_1));
    let task_2_result:i32 =  task_2.await.unwrap();
    print_num(number).await;
    println!("Here is task 2 by the way: {}",task_2_result);
    println!("End of async code");
}

pub async fn asyn_2() {
    println!("\n\nHello async 2\n");
    let data: Bytes = Bytes::from("Hello, world!");
    println!("{:?}", data);

    let mut buffer: BytesMut = BytesMut::with_capacity(32);
    buffer.put_slice(b"Hello");
    buffer.put_slice(b", world!");

    println!("{buffer:?}");
    let mut stream = tokio_stream::iter(&[1, 2, 3]);
    while let Some(v) = stream.next().await {
        println!("GOT = {:?}", v);
    }
    let f: i32 = 30;
    println!("Value of f: {f}");
}