use walkdir::WalkDir;
use std::io::Read;
use std::path::PathBuf;
use std::fs::File;
use std::process;

pub fn disk_usage() {
    let directory: WalkDir = WalkDir::new("./");
    let mut file_paths:Vec<PathBuf> = vec![];

    directory
        .into_iter()
        .filter_map(|e| e.ok())
        .for_each(|entry| {
            if entry.file_type().is_file() {
                file_paths.push(entry.path().to_owned());
            }
        }
    );
    let path: PathBuf = match file_paths.get(0) {
        Some(path)=>path.to_owned(),
        None=>PathBuf::new()
    };
    let file:File = match File::open(path) {
        Ok(file)=> file,
        Err(error)=> {
            println!("ERROR: {error}");
            process::exit(1);
        }
    };
    println!("File:{:?}",file.read_to_string(buf));
}