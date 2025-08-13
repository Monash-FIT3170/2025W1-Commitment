use serde_json::Value;
use std::path::PathBuf;

#[tauri::command]
pub async fn read_manifest() -> Result<Value, String> {
    let cwd = std::env::current_dir().map_err(|e| e.to_string())?;
    
    let root = find_gitgauge_root(cwd).ok_or("No .gitgauge folder found")?;

    let manifest_path = root.join(".gitgauge").join("repositories").join("manifest.json");

    let raw = tokio::fs::read_to_string(&manifest_path)
        .await
        .map_err(|e| format!("read {} failed: {e}", manifest_path.display()))?;

    let json: Value = serde_json::from_str(&raw)
        .map_err(|e| format!("parse {} failed: {e}", manifest_path.display()))?;

    Ok(json)
}

fn find_gitgauge_root(start_dir: PathBuf) -> Option<PathBuf> {
    let mut dir = start_dir.as_path();

    while dir.parent().is_some() {
        if dir.join(".gitgauge").exists() {
            return Some(dir.to_path_buf());
        }

        dir = dir.parent().unwrap();
    }

    None
}