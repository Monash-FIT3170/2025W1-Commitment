
use crate::ai_summary;
use std::collections::HashMap;

#[tauri::command]
pub async fn get_ai_summary(path: &str) -> Result<HashMap<String, String>, String> {
    let repo_path_str = path.to_string();
    ai_summary::summarize_all_contributors(&repo_path_str).await
}
