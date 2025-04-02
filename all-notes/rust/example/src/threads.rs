use std::{sync::{mpsc, Arc, Mutex, MutexGuard}, thread::{self, JoinHandle}, time::Duration};


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
    println!("\n\nHello async!!");
    async fn hello() {
        println!("Hello world");
    }
    hello().await;
    println!("End of async code");
}