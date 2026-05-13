use ntfy_rs::{self as ntfy, Config, FileConfig};
use serde::Serialize;
use std::sync::Mutex;

pub struct NtfyState {
    handle: Mutex<Option<ntfy::ServerHandle>>,
    port: Mutex<u16>,
    topic: Mutex<String>,
}

impl NtfyState {
    pub fn new() -> Self {
        Self {
            handle: Mutex::new(None),
            port: Mutex::new(8090),
            topic: Mutex::new("de5000-alerts".to_string()),
        }
    }

    pub fn stop(&self) {
        if let Ok(mut handle) = self.handle.lock() {
            if let Some(h) = handle.take() {
                h.shutdown();
            }
        }
    }
}

#[derive(Serialize)]
pub struct NtfyStatus {
    running: bool,
    port: u16,
    topic: String,
    subscribe_url: String,
}

#[tauri::command]
pub fn ntfy_start(
    state: tauri::State<'_, NtfyState>,
    port: Option<u16>,
    topic: Option<String>,
) -> Result<NtfyStatus, String> {
    // Stop existing instance if running
    state.stop();

    let p = port.unwrap_or(*state.port.lock().map_err(|e| e.to_string())?);
    let t = topic.unwrap_or_else(|| {
        state.topic.lock().map(|g| g.clone()).unwrap_or_else(|_| "de5000-alerts".to_string())
    });

    *state.port.lock().map_err(|e| e.to_string())? = p;
    *state.topic.lock().map_err(|e| e.to_string())? = t.clone();

    let local_ip = local_ip_address::local_ip()
        .map(|ip| ip.to_string())
        .unwrap_or_else(|_| "127.0.0.1".to_string());

    let base_url = format!("http://{}:{}", local_ip, p);

    let config = Config::resolve(
        FileConfig::default(),
        &ntfy::config::ServeArgs {
            config: std::path::PathBuf::from("server.toml"),
            listen_http: Some(format!(":{}", p)),
            cache_file: None,
            log_level: "info".to_string(),
            base_url: Some(base_url),
            listen_https: None,
            cert_file: None,
            key_file: None,
            listen_unix: None,
            upstream_base_url: Some("https://ntfy.sh".to_string()),
            upstream_access_token: None,
        },
    );

    let handle = ntfy::start(config).map_err(|e| format!("Failed to start ntfy: {}", e))?;
    *state.handle.lock().map_err(|e| e.to_string())? = Some(handle);

    Ok(NtfyStatus {
        running: true,
        port: p,
        topic: t.clone(),
        subscribe_url: format!("http://{}:{}/{}", local_ip, p, t),
    })
}

#[tauri::command]
pub fn ntfy_stop(state: tauri::State<'_, NtfyState>) -> Result<NtfyStatus, String> {
    state.stop();

    let p = *state.port.lock().map_err(|e| e.to_string())?;
    let t = state.topic.lock().map_err(|e| e.to_string())?.clone();

    Ok(NtfyStatus {
        running: false,
        port: p,
        topic: t,
        subscribe_url: String::new(),
    })
}

#[tauri::command]
pub fn ntfy_status(state: tauri::State<'_, NtfyState>) -> Result<NtfyStatus, String> {
    let handle = state.handle.lock().map_err(|e| e.to_string())?;
    let running = handle.is_some();
    let p = *state.port.lock().map_err(|e| e.to_string())?;
    let t = state.topic.lock().map_err(|e| e.to_string())?.clone();

    let subscribe_url = if running {
        let local_ip = local_ip_address::local_ip()
            .map(|ip| ip.to_string())
            .unwrap_or_else(|_| "127.0.0.1".to_string());
        format!("http://{}:{}/{}", local_ip, p, t)
    } else {
        String::new()
    };

    Ok(NtfyStatus {
        running,
        port: p,
        topic: t,
        subscribe_url,
    })
}

#[tauri::command]
pub fn ntfy_publish(
    state: tauri::State<'_, NtfyState>,
    title: String,
    message: String,
    priority: Option<String>,
) -> Result<(), String> {
    let handle = state.handle.lock().map_err(|e| e.to_string())?;
    let h = handle.as_ref().ok_or("ntfy server is not running")?;

    let t = state.topic.lock().map_err(|e| e.to_string())?.clone();
    let pri = priority.unwrap_or_default();

    h.publish(&t, &title, &message, &pri)
        .map_err(|e| format!("Failed to publish notification: {}", e))?;

    Ok(())
}
