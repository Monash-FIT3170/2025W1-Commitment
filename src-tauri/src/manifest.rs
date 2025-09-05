use std::path::PathBuf;

/*
manifest.json is this format
{
    "repository": [
        {
            "name": "<repository-name>",
            "url": "<repository-url>"
            "path": "<repository-path>"
            "last-accessed": "<timestamp>",
            "cloned": true/false (Indicates if the repository is cloned or if its a local repository)
            "bookmarked": true/false
            "email_mapping": {
                "Name": [
                    "email1@example.com",
                    "email2@example.com",
                    ...
                ]
            } | Null,
            "grading_sheet": String | Null
        }
    ]
}
    */

use dirs::data_dir;

#[tauri::command]
pub async fn get_working_directory() -> String {
    let mut path = data_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("gitgauge");
    path.to_str().unwrap_or_default().to_string()
}

async fn get_manifest_path() -> PathBuf {
    let mut path = data_dir().unwrap_or_else(|| PathBuf::from(".")); // Fallback to current dir if data_dir fails
    path.push("gitgauge");
    path.push("manifest.json");
    log::info!("Manifest path: {path:?}");
    path
}

#[tauri::command(rename_all = "snake_case")]
pub async fn read_manifest() -> Result<serde_json::Value, String> {
    let path = get_manifest_path().await;
    if !path.exists() {
        create_manifest().await?;
    }
    let content = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

async fn create_manifest() -> Result<(), String> {
    let manifest = serde_json::json!({
        "repository": []
    });

    let path = get_manifest_path().await;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(
        path,
        serde_json::to_string_pretty(&manifest).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn check_manifest() -> Result<(), String> {
    if !get_manifest_path().await.exists() {
        return create_manifest().await;
    }
    let manifest = read_manifest().await?;
    let mut manifest_changed = false;
    let mut updated_repos = Vec::new();

    if let Some(repos) = manifest.get("repository").and_then(|r| r.as_array()) {
        for repo in repos {
            if check_repository(repo).await.is_err() {
                manifest_changed = true;
                if let Some(path_str) = repo.get("path").and_then(|p| p.as_str()) {
                    let repo_path = PathBuf::from(path_str);
                    if repo_path.is_dir() {
                        if let Err(e) = std::fs::remove_dir_all(&repo_path) {
                            eprintln!("Failed to delete repository directory {path_str}: {e}");
                        }
                    }
                }
            } else {
                updated_repos.push(repo.clone());
            }
        }
    }

    if manifest_changed {
        let mut new_manifest = manifest.clone();
        new_manifest["repository"] = serde_json::Value::Array(updated_repos);
        let path = get_manifest_path().await;
        std::fs::write(
            path,
            serde_json::to_string_pretty(&new_manifest).map_err(|e| e.to_string())?,
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

async fn check_repository(repo: &serde_json::Value) -> Result<(), bool> {
    // Repositories which are not Bookmarked stay cloned for 30 days
    if let Some(last_accessed) = repo.get("last_accessed").and_then(|l| l.as_str()) {
        if let Ok(last_accessed_time) = chrono::DateTime::parse_from_rfc3339(last_accessed) {
            let now = chrono::Utc::now();
            if now.signed_duration_since(last_accessed_time).num_days() < 30
                && repo
                    .get("cloned")
                    .and_then(|c| c.as_bool())
                    .unwrap_or(false)
            {
                return Ok(());
            }
        }
    }

    Err(false)
}

async fn save_manifest_file(manifest: &serde_json::Value) -> Result<(), String> {
    let path = get_manifest_path().await;
    std::fs::write(
        path,
        serde_json::to_string_pretty(manifest).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// Exposed to the frontend. The frontend invokes this with the full manifest JSON
// object (e.g. invoke('save_manifest', { manifest: $manifest })). This wrapper
// forwards to the internal file writer.
#[tauri::command(rename_all = "snake_case")]
pub async fn save_manifest(manifest: serde_json::Value) -> Result<(), String> {
    save_manifest_file(&manifest).await
}
