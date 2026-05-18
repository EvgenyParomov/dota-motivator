use std::net::SocketAddr;
use std::ops::RangeInclusive;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU16, Ordering};

use axum::{routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tokio::net::TcpListener;

const PORT_RANGE: RangeInclusive<u16> = 7383..=7392;
static GSI_PORT: AtomicU16 = AtomicU16::new(0);

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GsiEvent {
    #[serde(rename = "matchId")]
    pub match_id: String,
    pub phase: String,
    #[serde(rename = "lobbyType")]
    pub lobby_type: String,
}

const GSI_CONFIG_FILENAME: &str = "gamestate_integration_motivator.cfg";

fn cfg_for_port(port: u16) -> String {
    format!(
        r#""dota2-motivator"
{{
    "uri"           "http://127.0.0.1:{port}/gsi"
    "timeout"       "5.0"
    "buffer"        "0.1"
    "throttle"      "0.1"
    "heartbeat"     "30.0"
    "data"
    {{
        "provider"      "1"
        "map"           "1"
        "player"        "1"
        "hero"          "1"
    }}
}}
"#
    )
}

// Parses every `"path"  "<value>"` line out of libraryfolders.vdf.
// VDF on Windows escapes backslashes as `\\` — we undo that.
fn parse_steam_libraries_from_vdf(content: &str) -> Vec<PathBuf> {
    let mut out = Vec::new();
    for line in content.lines() {
        let line = line.trim();
        let Some(rest) = line.strip_prefix("\"path\"") else {
            continue;
        };
        let rest = rest.trim_start();
        let Some(rest) = rest.strip_prefix('"') else {
            continue;
        };
        let Some(value) = rest.strip_suffix('"') else {
            continue;
        };
        out.push(PathBuf::from(value.replace("\\\\", "\\")));
    }
    out
}

#[cfg(target_os = "windows")]
fn steam_install_path_from_registry() -> Option<PathBuf> {
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;
    let key = RegKey::predef(HKEY_CURRENT_USER)
        .open_subkey("Software\\Valve\\Steam")
        .ok()?;
    let path: String = key.get_value("SteamPath").ok()?;
    Some(PathBuf::from(path))
}

#[cfg(not(target_os = "windows"))]
fn steam_install_path_from_registry() -> Option<PathBuf> {
    None
}

fn collect_steam_roots() -> Vec<PathBuf> {
    let mut roots: Vec<PathBuf> = Vec::new();

    if let Some(p) = steam_install_path_from_registry() {
        roots.push(p);
    }
    if cfg!(target_os = "windows") {
        roots.push(PathBuf::from(r"C:\Program Files (x86)\Steam"));
        roots.push(PathBuf::from(r"D:\Steam"));
    } else if let Ok(home) = std::env::var("HOME") {
        roots.push(PathBuf::from(format!("{}/.steam/steam", home)));
        roots.push(PathBuf::from(format!("{}/.local/share/Steam", home)));
    }

    roots.retain(|p| p.exists());
    roots.sort();
    roots.dedup();
    roots
}

fn collect_steam_libraries() -> Vec<PathBuf> {
    let mut libraries: Vec<PathBuf> = Vec::new();
    for root in collect_steam_roots() {
        libraries.push(root.clone());
        let vdf = root.join("config").join("libraryfolders.vdf");
        if let Ok(content) = std::fs::read_to_string(&vdf) {
            for lib in parse_steam_libraries_from_vdf(&content) {
                libraries.push(lib);
            }
        }
    }
    libraries.sort();
    libraries.dedup();
    libraries
}

fn find_dota_cfg_dir() -> Option<PathBuf> {
    let suffix = PathBuf::from("steamapps/common/dota 2 beta/game/dota/cfg/gamestate_integration");
    for lib in collect_steam_libraries() {
        let dota_dir = lib.join("steamapps").join("common").join("dota 2 beta");
        if dota_dir.exists() {
            return Some(lib.join(&suffix));
        }
    }
    None
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "lowercase", tag = "status")]
pub enum GsiConfigStatus {
    Ok { path: String },
    Written { path: String },
    ManualRequired { content: String },
}

#[tauri::command]
pub fn ensure_gsi_config() -> GsiConfigStatus {
    let port = GSI_PORT.load(Ordering::SeqCst);
    let cfg = cfg_for_port(if port == 0 { *PORT_RANGE.start() } else { port });

    let Some(dir) = find_dota_cfg_dir() else {
        return GsiConfigStatus::ManualRequired { content: cfg };
    };
    let path = dir.join(GSI_CONFIG_FILENAME);

    // Idempotent: only write when content actually differs (e.g. port changed)
    if let Ok(existing) = std::fs::read_to_string(&path) {
        if existing == cfg {
            return GsiConfigStatus::Ok { path: path.to_string_lossy().into_owned() };
        }
    }
    let _ = std::fs::create_dir_all(&dir);
    if std::fs::write(&path, &cfg).is_ok() {
        return GsiConfigStatus::Written { path: path.to_string_lossy().into_owned() };
    }
    GsiConfigStatus::ManualRequired { content: cfg }
}

#[tauri::command]
pub fn get_gsi_port() -> u16 {
    GSI_PORT.load(Ordering::SeqCst)
}

async fn bind_first_free() -> std::io::Result<TcpListener> {
    let mut last_err: Option<std::io::Error> = None;
    for port in PORT_RANGE {
        let addr: SocketAddr = ([127, 0, 0, 1], port).into();
        match TcpListener::bind(addr).await {
            Ok(listener) => return Ok(listener),
            Err(e) => last_err = Some(e),
        }
    }
    Err(last_err.unwrap_or_else(|| {
        std::io::Error::new(std::io::ErrorKind::AddrInUse, "no free port in range")
    }))
}

#[tauri::command]
pub async fn start_gsi_listener(app: AppHandle) -> Result<u16, String> {
    // Already running — return current port.
    let current = GSI_PORT.load(Ordering::SeqCst);
    if current != 0 {
        return Ok(current);
    }

    let listener = bind_first_free().await.map_err(|e| {
        format!(
            "failed to bind GSI listener in range {}-{}: {}",
            PORT_RANGE.start(),
            PORT_RANGE.end(),
            e
        )
    })?;
    let port = listener
        .local_addr()
        .map_err(|e| e.to_string())?
        .port();

    // Mark as bound before spawning so concurrent invokes don't double-bind.
    GSI_PORT.store(port, Ordering::SeqCst);

    let app_for_route = app.clone();
    tokio::spawn(async move {
        let router = Router::new().route(
            "/gsi",
            post(move |Json(payload): Json<serde_json::Value>| {
                let app = app_for_route.clone();
                async move {
                    if let Some(event) = extract_event(&payload) {
                        let _ = app.emit("gsi-event", event);
                    }
                    "ok"
                }
            }),
        );
        let _ = axum::serve(listener, router).await;
        // Listener stopped — clear so a future invoke can re-bind.
        GSI_PORT.store(0, Ordering::SeqCst);
    });

    Ok(port)
}

fn extract_event(payload: &serde_json::Value) -> Option<GsiEvent> {
    let phase = payload
        .pointer("/map/game_state")
        .and_then(|v| v.as_str())
        .map(|s| match s {
            "DOTA_GAMERULES_STATE_PRE_GAME" => "pre_game",
            "DOTA_GAMERULES_STATE_GAME_IN_PROGRESS" => "game_in_progress",
            "DOTA_GAMERULES_STATE_POST_GAME" => "post_game",
            _ => "",
        })
        .filter(|s| !s.is_empty())?;
    let match_id = payload
        .pointer("/map/matchid")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    if match_id.is_empty() {
        return None;
    }
    let lobby_type = payload
        .pointer("/map/customgamename")
        .or_else(|| payload.pointer("/map/lobby_type"))
        .and_then(|v| v.as_str())
        .unwrap_or("public")
        .to_string();
    Some(GsiEvent { match_id, phase: phase.to_string(), lobby_type })
}
