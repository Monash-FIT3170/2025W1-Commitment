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
            match check_repository(repo).await {
                Ok(()) => {
                    // Repository should stay in manifest
                    updated_repos.push(repo.clone());
                }
                Err(should_delete_directory) => {
                    // Repository should be removed from manifest
                    manifest_changed = true;

                    // Delete directory only if cloned=true and >30 days
                    if should_delete_directory {
                        if let Some(path_str) = repo.get("path").and_then(|p| p.as_str()) {
                            let repo_path = PathBuf::from(path_str);
                            if repo_path.is_dir() {
                                if let Err(e) = std::fs::remove_dir_all(&repo_path) {
                                    eprintln!(
                                        "Failed to delete repository directory {path_str}: {e}"
                                    );
                                }
                            }
                        }
                    }
                }
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
    // If repository is bookmarked, it always stays in the manifest
    if let Some(bookmarked) = repo.get("bookmarked").and_then(|b| b.as_bool()) {
        if bookmarked {
            return Ok(());
        }
    }
    // If repository is visited, it always stays in the manifest
    if let Some(visited) = repo.get("visited").and_then(|b| b.as_bool()) {
        if visited {
            return Ok(());
        }
    }

    // Check if the repository has been accessed within 30 days
    if let Some(last_accessed) = repo.get("last_accessed").and_then(|l| l.as_str()) {
        match chrono::DateTime::parse_from_rfc3339(last_accessed) {
            Ok(last_accessed_time) => {
                let now = chrono::Utc::now();
                log::info!("Last accessed: {last_accessed_time}, Now: {now}");

                // If accessed within 30 days, keep the repository
                if now.signed_duration_since(last_accessed_time).num_days() < 30 {
                    return Ok(());
                }

                // If older than 30 days and not bookmarked, determine cleanup action
                let cloned = repo
                    .get("cloned")
                    .and_then(|c| c.as_bool())
                    .unwrap_or(false);

                // Return Err(true) if directory should be deleted (cloned=true)
                // Return Err(false) if only manifest entry should be removed (cloned=false)
                return Err(cloned);
            }
            Err(e) => {
                log::warn!("Failed to parse datetime '{last_accessed}': {e}");
                // For invalid datetime, assume it's old and handle based on cloned status
                let cloned = repo
                    .get("cloned")
                    .and_then(|c| c.as_bool())
                    .unwrap_or(false);
                return Err(cloned);
            }
        }
    }

    // If no last_accessed field, assume it's old and handle based on cloned status
    let cloned = repo
        .get("cloned")
        .and_then(|c| c.as_bool())
        .unwrap_or(false);
    Err(cloned)
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
