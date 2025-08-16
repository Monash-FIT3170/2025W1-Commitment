mod branches;
mod contributor;
mod repositories;
mod url_verifier;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            branches::get_branch_names,
            contributor::get_contributor_info,
            repositories::bare_clone,
            repositories::is_repo_cloned,
            url_verifier::verify_and_extract_source_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
