use git2::{build::RepoBuilder, RemoteCallbacks};

use crate::manifest::{create_repository, update_repository_last_accessed};

fn clone_progress(cur_progress: usize, total_progress: usize) {
    println!("\rProgress: {cur_progress}/{total_progress}");
}

#[tauri::command]
pub fn is_repo_cloned(path: &str) -> bool {
    std::path::Path::new(path).exists()
}

#[tauri::command]
pub async fn bare_clone(
    owner: &str,
    repo: &str,
    source_type: i32,
    path: &str,
) -> Result<(), String> {
    // Check if path is a valid directory
    if is_repo_cloned(path) {
        log::info!("Repository already exists at: {}", path);
        update_repository_last_accessed(format!("{}/{}", owner, repo).as_str()).await?;
        return Ok(()); // Repository is already cloned, no need to clone again
    }

    if source_type == 2 {
        // For local files, we just need to create the directory if it doesn't exist
        std::fs::create_dir_all(path).map_err(|e| e.to_string())?;
        log::info!("Local repository path created at: {}", path);
        return create_repository(&format!("{}/{}", owner, repo), path, true).await;
    }

    let url_base = if source_type == 0 {
        "https://github.com"
    } else if source_type == 1 {
        "https://gitlab.com"
    } else {
        return Err("Invalid source type".to_string());
    };

    let url = format!("{}/{}/{}", url_base, owner, repo);
    create_repository(&url, path, false).await?;

    let mut callbacks = RemoteCallbacks::new();

    callbacks.transfer_progress(|progress| {
        clone_progress(progress.received_objects(), progress.total_objects());
        true
    });

    let mut fetch_opts = git2::FetchOptions::new();
    fetch_opts.remote_callbacks(callbacks);

    RepoBuilder::new()
        .bare(true) // Set to true for a bare clone
        .fetch_options(fetch_opts)
        .clone(&url, std::path::Path::new(path))
        .map_err(|e| e.to_string())?;

    log::info!("Repository cloned successfully at: {path}");
    Ok(())
}
