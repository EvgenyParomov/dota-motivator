use std::net::SocketAddr;
use std::sync::Arc;

use axum::{extract::Query, response::Html, routing::get, Router};
use serde::Deserialize;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::oneshot;

use crate::AppState;

#[derive(Debug, Deserialize)]
struct AuthCallbackQuery {
    token: Option<String>,
}

#[tauri::command]
pub fn set_server_url(state: State<'_, AppState>, url: String) {
    if let Ok(mut s) = state.server_base_url.lock() {
        *s = url;
    }
}

#[tauri::command]
pub async fn start_auth_callback_listener(app: AppHandle) -> Result<u16, String> {
    let port = 5187u16;
    let (tx, rx) = oneshot::channel::<String>();
    let tx = Arc::new(tokio::sync::Mutex::new(Some(tx)));

    let app_for_route = app.clone();
    let tx_for_route = tx.clone();
    tokio::spawn(async move {
        let router = Router::new().route(
            "/",
            get(move |Query(q): Query<AuthCallbackQuery>| {
                let app = app_for_route.clone();
                let tx = tx_for_route.clone();
                async move {
                    if let Some(token) = q.token {
                        if let Some(sender) = tx.lock().await.take() {
                            let _ = sender.send(token.clone());
                        }
                        let _ = app.emit("auth-token", token);
                    }
                    Html("<html><body><h2>Готово</h2><p>Можно закрыть вкладку.</p></body></html>")
                }
            }),
        );
        let addr: SocketAddr = ([127, 0, 0, 1], port).into();
        if let Ok(listener) = tokio::net::TcpListener::bind(addr).await {
            let _ = axum::serve(listener, router).await;
        }
    });

    // Detach: we don't await the oneshot here, the React side listens for the emit.
    let _ = rx;
    Ok(port)
}
