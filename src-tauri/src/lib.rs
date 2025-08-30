mod branches;
mod contributor;
mod repositories;
mod url_verifier;
mod manifest;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Check manifest on startup
    tauri::async_runtime::spawn(async {
        if let Err(e) = manifest::check_manifest().await {
            eprintln!("Manifest check failed: {}", e);
            // You can decide whether to exit the app or continue
            // std::process::exit(1); // Uncomment to exit on failure
        } else {
            println!("Manifest check passed");
        }
    });
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            branches::get_branch_names,
            contributor::get_contributor_info,
            repositories::bare_clone,
            repositories::is_repo_cloned,
            url_verifier::verify_and_extract_source_info,
            manifest::read_manifest,
            manifest::get_bookmarked_repositories,
            manifest::set_bookmarked_repository,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
