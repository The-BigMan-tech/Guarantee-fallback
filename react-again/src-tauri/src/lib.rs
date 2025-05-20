use home::home_dir;
use std::env;
use std::fs;
use std::path::Path;
use std::path::PathBuf;
use std::time::SystemTime;
use tauri::command;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            read_dir,
            join_with_home,
            path_join,
            path_extname,
            path_basename,
            fs_stat,
            read_file
        ])
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
#[derive(serde::Serialize,serde::Deserialize)]
#[serde(rename_all = "lowercase")] 
pub enum SortOrder {
    Arbitrary,
    Alphabetical,
    Date, // Sort by modified date, oldest to newest
    Size
}
#[command]
fn read_dir(dir_path: String,order:SortOrder) -> Result<Vec<PathBuf>, String> {
    println!("I was invoked from JavaScript!");
    let entries: fs::ReadDir = fs::read_dir(&dir_path).map_err(|e| e.to_string())?;
    let mut file_paths: Vec<PathBuf> = Vec::new();
    for entry in entries {
        match entry {
            Ok(entry) => file_paths.push(entry.path()),
            Err(e) => return Err(e.to_string()), // Handle entry error
        }
    }
    match order {
        SortOrder::Arbitrary => {
            // Do nothing, keep the original order
            println!("Arbritrary order selected");
        }
        SortOrder::Alphabetical => {
            file_paths.sort_by_key(|path| path.file_name().map(|name| name.to_os_string()));
            println!("Alphabetical order selected");
        }
        SortOrder::Date => {
            // Sort by modified date, oldest first
            println!("Date order selected");
            file_paths.sort_by_key(|path| {
                fs::metadata(path)
                    .and_then(|meta| meta.modified())
                    .unwrap_or(SystemTime::UNIX_EPOCH)
            });
        }
        SortOrder::Size => {
            println!("Size order selected");
            file_paths.sort_by_key(|path| {
                fs::metadata(path)
                    .map(|m| m.len())
                    .unwrap_or(0) // Treat errors as size 0 or handle differently
            });
        }
    }
    Ok(file_paths) // Return the collected file paths
}
#[command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
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
    let joined_path: PathBuf = base_path.join(additional);
    joined_path
}
#[command]
fn path_extname(path: &str) -> Option<String> {
    Path::new(path)
        .extension()
        .and_then(|s| s.to_str())
        .map(|s| s.to_string())
}
#[command]
fn path_basename(path: &str) -> Option<String> {
    Path::new(path)
        .file_name()
        .and_then(|s| s.to_str())
        .map(|s| s.to_string())
}
#[derive(serde::Serialize)] // Ensure this trait is implemented for IPC serialization
struct FileStat {
    size_in_bytes: u64,
    modified_date: SystemTime,
    created_date: SystemTime,
    accessed_date: SystemTime,
    is_read_only: bool,
}
#[command]
fn fs_stat(path: &str) -> Result<FileStat, String> {
    let metadata: fs::Metadata = fs::metadata(path).map_err(|e| e.to_string())?;

    let size_in_bytes: u64 = metadata.len() / 8;
    let modified_date: SystemTime = metadata.modified().map_err(|e| e.to_string())?;
    let created_date: SystemTime = metadata.created().map_err(|e| e.to_string())?;
    let accessed_date: SystemTime = metadata.accessed().map_err(|e| e.to_string())?;
    let is_read_only: bool = metadata.permissions().readonly();

    Ok(FileStat {
        size_in_bytes,
        modified_date,
        created_date,
        accessed_date,
        is_read_only,
    })
}
