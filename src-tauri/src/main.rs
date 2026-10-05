//! Desktop entry point.
//!
//! The entire application is the web front-end in `../dist`; Rust only provides
//! the native window and the system webview. There is no IPC surface, no file
//! system access and no network access — which is why the app can run with a
//! strict CSP and needs no Tauri permissions beyond `core:default`.

// Hide the extra console window on Windows release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    pf_roi_calculator_lib::run();
}
