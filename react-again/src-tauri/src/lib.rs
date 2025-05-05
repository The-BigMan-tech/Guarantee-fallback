use std::fs;
use std::path::PathBuf;
use tauri::command;
use home::home_dir;
use std::env;
use std::path::Path;
use std::time::SystemTime;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![read_dir,join_with_home,path_join,path_extname,path_basename,fs_stat])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
#[command]
fn read_dir(dir_path: String) -> Result<Vec<PathBuf>, String> {
    println!("I was invoked from JavaScript!");
    let entries: fs::ReadDir = fs::read_dir(&dir_path).map_err(|e| e.to_string())?;
    let mut file_paths: Vec<PathBuf> = Vec::new();
    for entry in entries {
        match entry {
            Ok(entry) => file_paths.push(entry.path()),
            Err(e) => return Err(e.to_string()), // Handle entry error
        }
    }
    Ok(file_paths) // Return the collected file paths
}
#[command]
fn join_with_home(tab_name: &str) -> Result<String, String> {
    match home_dir() {
        Some(home) => {
            let path: PathBuf = home.join(tab_name);
            Ok(path.to_string_lossy().into_owned()) // Convert to String
        }
        None => Err("Failed to get home directory".into()),
    }
}
#[command]
fn path_join(base: &str, additional: &str) -> PathBuf {
    let base_path: &Path = Path::new(base);
    base_path.join(additional)
}
#[command]
fn path_extname(path: &str) -> Option<String> {
    Path::new(path).extension().and_then(|s| s.to_str()).map(|s| s.to_string())
}
#[command]
fn path_basename(path: &str) -> Option<String> {
    Path::new(path).file_name().and_then(|s| s.to_str()).map(|s| s.to_string())
}
#[derive(serde::Serialize)] // Ensure this trait is implemented for IPC serialization
struct FileStat {
    size: u64,
    mtime: SystemTime,
    birthtime: SystemTime,
    atime: SystemTime,
    mode:bool 
}
#[command]
fn fs_stat(path: &str) -> Result<FileStat, String> {
    let metadata: fs::Metadata = fs::metadata(path).map_err(|e| e.to_string())?;

    let size: u64 = metadata.len();
    let mtime: SystemTime = metadata.modified().map_err(|e| e.to_string())?;
    let atime: SystemTime = metadata.accessed().map_err(|e| e.to_string())?;
    let birthtime: SystemTime = metadata.created().map_err(|e| e.to_string())?;
    let mode: bool = metadata.permissions().readonly();

    Ok(FileStat {
        size,
        mtime,
        birthtime,
        atime,
        mode,
    })
}