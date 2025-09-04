mod branches;
mod config;
mod contributor;
mod manifest;
mod repositories;
mod url_verifier;

// use tauri_plugin_fs;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Check manifest on startup
    tauri::async_runtime::spawn(async {
        if let Err(e) = manifest::check_manifest().await {
            eprintln!("Manifest check failed: {e}");
            // You can decide whether to exit the app or continue
            // std::process::exit(1); // Uncomment to exit on failure
        } else {
            println!("Manifest check passed");
        }
    });
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            branches::get_branch_names,
            contributor::get_contributor_info,
            contributor::group_contributors_by_config,
            repositories::bare_clone,
            repositories::try_clone_with_token,
            repositories::is_repo_cloned,
            url_verifier::verify_and_extract_source_info,
            manifest::read_manifest,
            manifest::save_manifest
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
