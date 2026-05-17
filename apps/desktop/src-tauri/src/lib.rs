mod dota_process;
mod gsi;
mod auth_listener;

use std::sync::Mutex;

pub struct AppState {
    pub server_base_url: Mutex<String>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt::init();
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            server_base_url: Mutex::new(
                std::env::var("DM_SERVER_URL").unwrap_or_else(|_| "http://localhost:4000".into()),
            ),
        })
        .invoke_handler(tauri::generate_handler![
            dota_process::is_dota_running,
            dota_process::kill_dota,
            gsi::ensure_gsi_config,
            gsi::start_gsi_listener,
            auth_listener::start_auth_callback_listener,
            auth_listener::set_server_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
