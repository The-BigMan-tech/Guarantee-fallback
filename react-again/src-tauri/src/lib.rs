// use base64::Engine;
// use home::home_dir;
// use std::env;
// use std::fs;
// use std::path::Path;
// use std::path::PathBuf;
// use std::time::{SystemTime,UNIX_EPOCH};
// use tauri::command;
// use tauri_plugin_log::{Builder as LogBuilder,Target,TargetKind};
// use log::LevelFilter;
// use base64::engine::general_purpose::STANDARD;
// use infer::Infer;
// use tauri_plugin_log::RotationStrategy;

// #[cfg_attr(mobile, tauri::mobile_entry_point)]
// pub fn run() {    
//     tauri::Builder::default()
//         .plugin(tauri_plugin_fs::init())
//         .invoke_handler(tauri::generate_handler![
//             read_dir,
//             join_with_home,
//             path_join,
//             path_extname,
//             path_basename,
//             fs_stat,
//             read_file_as_base64,
//             get_mime_type,
//             get_mtime
//         ])
//         .setup(|app| {   
//             app.handle().plugin(
//                 LogBuilder::new()
//                 .targets([
//                     Target::new(TargetKind::LogDir {file_name: Some("app-log".into())})
//                 ])
//                 .max_file_size(10 * 1024 * 1024) // 10 MB max per file
//                 .rotation_strategy(RotationStrategy::KeepAll) // 
//                 .level(LevelFilter::Debug)
//                 .format(
//                     |out, message, record| {
//                         out.finish(format_args!("|{}|: {}", record.level(), message))
//                     }
//                 )
//                 .build(),
//             )?;
//             Ok(())
//         })
//         .run(tauri::generate_context!())
//         .expect("error while running tauri application");
// }
// #[derive(serde::Serialize)] // Ensure this trait is implemented for IPC serialization
// struct FileStat {
//     size_in_bytes: u64,
//     modified_date:u128,
//     created_date:u128,
//     accessed_date:u128,
//     is_read_only: bool,
// }

// #[command]
// fn read_dir(dir_path: String) -> Result<Vec<PathBuf>, String> {
//     println!("I was invoked from JavaScript!");
//     let entries: fs::ReadDir = fs::read_dir(&dir_path).map_err(|e| e.to_string())?;
//     let mut file_paths: Vec<PathBuf> = Vec::new();
//     for entry in entries {
//         match entry {
//             Ok(entry) => file_paths.push(entry.path()),
//             Err(e) => return Err(e.to_string()), // Handle entry error
//         }
//     }
//     Ok(file_paths) // Return the collected file paths
// }
// #[command]
// fn read_file_as_base64(path: String) -> Result<String, String> {
//     match fs::read(&path) {
//         Ok(bytes) => Ok(STANDARD.encode(&bytes)),
//         Err(e) => Err(e.to_string()),
//     }
// }
// #[command]
// fn get_mime_type(path: String) -> String {
//     if path.to_lowercase().ends_with(".svg") {
//         return "image/svg+xml".to_string();
//     }
//     let v = Infer::new();
//     let mime = v.get_from_path(path).unwrap().map(|k| k.mime_type());
//     mime.unwrap_or("application/octet-stream").to_string()
// }
// #[command]
// fn join_with_home(tab_name: &str) -> Result<String, String> {
//     match home_dir() {
//         Some(home) => {
//             let path: PathBuf = home.join(tab_name);
//             Ok(path.to_string_lossy().into_owned()) // Convert to String
//         }
//         None => Err("Failed to get home directory".into()),
//     }
// }
// #[command]
// fn get_mtime(path: &str) -> Result<u128, String> {
//     let metadata: fs::Metadata = fs::metadata(path).map_err(|e| e.to_string())?;
//     let mtime:SystemTime = metadata.modified().map_err(|e| e.to_string())?;
//     let duration = mtime.duration_since(UNIX_EPOCH).map_err(|e| e.to_string())?;
//     Ok(duration.as_millis())
// }
// #[command]
// fn fs_stat(path: &str) -> Result<FileStat, String> {
//     let metadata: fs::Metadata = fs::metadata(path).map_err(|e| e.to_string())?;

//     let size_in_bytes: u64 = metadata.len();
//     let modified_date: SystemTime = metadata.modified().map_err(|e| e.to_string())?;
//     let created_date: SystemTime = metadata.created().map_err(|e| e.to_string())?;
//     let accessed_date: SystemTime = metadata.accessed().map_err(|e| e.to_string())?;
//     let is_read_only: bool = metadata.permissions().readonly();

//     let mdate = modified_date.duration_since(UNIX_EPOCH).map_err(|e| e.to_string())?;
//     let cdate = created_date.duration_since(UNIX_EPOCH).map_err(|e| e.to_string())?;
//     let adate = accessed_date.duration_since(UNIX_EPOCH).map_err(|e| e.to_string())?;
//     Ok(FileStat {
//         size_in_bytes,
//         modified_date:mdate.as_millis(),
//         created_date:cdate.as_millis(),
//         accessed_date:adate.as_millis(),
//         is_read_only,
//     })
// }
// #[command]
// fn path_join(base: &str, additional: &str) -> PathBuf {
//     let base_path: &Path = Path::new(base);
//     let joined_path: PathBuf = base_path.join(additional);
//     joined_path
// }
// #[command]
// fn path_extname(path: &str) -> Option<String> {
//     Path::new(path)
//         .extension()
//         .and_then(|s| s.to_str())
//         .map(|s| s.to_string())
// }
// #[command]
// fn path_basename(path: &str) -> Option<String> {
//     Path::new(path)
//         .file_name()
//         .and_then(|s| s.to_str())
//         .map(|s| s.to_string())
// }