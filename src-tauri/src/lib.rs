//! Library half of the Tauri shell.
//!
//! Kept separate from `main.rs` so the same entry point can be reused by the
//! mobile targets (`tauri::mobile_entry_point`) without duplicating setup.

/// Build and run the desktop window.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("failed to start PF ROI Calculator");
}
