mod serial;
mod notify;

use serial::SerialState;
use notify::NtfyState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(SerialState::new())
        .manage(NtfyState::new())
        .invoke_handler(tauri::generate_handler![
            serial::list_ports,
            serial::connect,
            serial::disconnect,
            notify::ntfy_start,
            notify::ntfy_stop,
            notify::ntfy_status,
            notify::ntfy_publish,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let state = window.state::<NtfyState>();
                state.stop();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
