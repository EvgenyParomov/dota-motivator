use std::net::SocketAddr;
use std::path::PathBuf;

use axum::{routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GsiEvent {
    #[serde(rename = "matchId")]
    pub match_id: String,
    pub phase: String,
    #[serde(rename = "lobbyType")]
    pub lobby_type: String,
}

const GSI_CONFIG_FILENAME: &str = "gamestate_integration_motivator.cfg";

const CFG_TEMPLATE: &str = r#""dota2-motivator"
{
    "uri"           "http://127.0.0.1:7383/gsi"
    "timeout"       "5.0"
    "buffer"        "0.1"
    "throttle"      "0.1"
    "heartbeat"     "30.0"
    "data"
    {
        "provider"      "1"
        "map"           "1"
        "player"        "1"
        "hero"          "1"
    }
}
"#;

fn find_dota_cfg_dir() -> Option<PathBuf> {
    // Heuristic — checks common Steam install locations.
    let candidates = if cfg!(target_os = "windows") {
        vec![
            PathBuf::from(r"C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta\game\dota\cfg\gamestate_integration"),
            PathBuf::from(r"D:\Steam\steamapps\common\dota 2 beta\game\dota\cfg\gamestate_integration"),
        ]
    } else {
        let home = std::env::var("HOME").unwrap_or_default();
        vec![PathBuf::from(format!(
            "{}/.steam/steam/steamapps/common/dota 2 beta/game/dota/cfg/gamestate_integration",
            home
        ))]
    };
    for c in candidates {
        if let Some(parent) = c.parent() {
            if parent.exists() {
                return Some(c);
            }
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
    let Some(dir) = find_dota_cfg_dir() else {
        return GsiConfigStatus::ManualRequired { content: CFG_TEMPLATE.into() };
    };
    let path = dir.join(GSI_CONFIG_FILENAME);
    if path.exists() {
        return GsiConfigStatus::Ok { path: path.to_string_lossy().into_owned() };
    }
    let _ = std::fs::create_dir_all(&dir);
    if std::fs::write(&path, CFG_TEMPLATE).is_ok() {
        return GsiConfigStatus::Written { path: path.to_string_lossy().into_owned() };
    }
    GsiConfigStatus::ManualRequired { content: CFG_TEMPLATE.into() }
}

#[tauri::command]
pub async fn start_gsi_listener(app: AppHandle) -> Result<u16, String> {
    let port = 7383u16;
    tokio::spawn(async move {
        let router = Router::new().route(
            "/gsi",
            post(move |Json(payload): Json<serde_json::Value>| {
                let app = app.clone();
                async move {
                    if let Some(event) = extract_event(&payload) {
                        let _ = app.emit("gsi-event", event);
                    }
                    "ok"
                }
            }),
        );
        let addr: SocketAddr = ([127, 0, 0, 1], port).into();
        if let Ok(listener) = tokio::net::TcpListener::bind(addr).await {
            let _ = axum::serve(listener, router).await;
        }
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
