use notify::{RecommendedWatcher, RecursiveMode, Watcher, Config};
use std::sync::mpsc::channel;
use std::path::Path;

fn watch_path_forever<P: AsRef<Path>>(path: P) -> notify::Result<()> {
    let (tx, rx) = channel();
    let mut watcher = RecommendedWatcher::new(tx, Config::default())?;
    watcher.watch(path.as_ref(), RecursiveMode::NonRecursive)?;

    println!("Watching path {:?} indefinitely. Press Ctrl+C to stop.", path.as_ref());
    loop {
        match rx.recv() {
            Ok(event) => println!("Change detected: {:?}", event),
            Err(e) => {
                eprintln!("Watch error: {:?}", e);
                break; 
            }
        }
    }
    Ok(())
}

fn main() -> notify::Result<()> {
    watch_path_forever("C:\\Users\\USER\\Desktop\\dummy-code\\Guarantee\\all-notes\\rust\\f-watcher\\src")
}
