mod dota_process;
mod gsi;
mod auth_listener;

use std::sync::Mutex;

use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
use tauri_plugin_autostart::{ManagerExt, MacosLauncher};

pub struct AppState {
    pub server_base_url: Mutex<String>,
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt::init();
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
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
        .setup(|app| {
            let autostart_enabled = app
                .autolaunch()
                .is_enabled()
                .unwrap_or(false);

            let open_item = MenuItem::with_id(app, "open", "Открыть", true, None::<&str>)?;
            let autostart_item = CheckMenuItem::with_id(
                app,
                "autostart",
                "Запускать с системой",
                true,
                autostart_enabled,
                None::<&str>,
            )?;
            let separator = PredefinedMenuItem::separator(app)?;
            let quit_item = MenuItem::with_id(app, "quit", "Выйти", true, None::<&str>)?;
            let menu = Menu::with_items(
                app,
                &[&open_item, &autostart_item, &separator, &quit_item],
            )?;

            TrayIconBuilder::with_id("main")
                .tooltip("Dota Motivator")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .icon(app.default_window_icon().cloned().unwrap())
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => show_main_window(app),
                    "autostart" => {
                        let manager = app.autolaunch();
                        if manager.is_enabled().unwrap_or(false) {
                            let _ = manager.disable();
                        } else {
                            let _ = manager.enable();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main_window(tray.app_handle());
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
