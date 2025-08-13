use git2::{build::RepoBuilder, RemoteCallbacks};

fn clone_progress(cur_progress: usize, total_progress: usize) {
    println!("\rProgress: {}/{}", cur_progress, total_progress);
}

#[tauri::command]
pub fn is_repo_cloned(path: &str) -> bool {
    std::path::Path::new(path).exists()
}

#[tauri::command]
pub async fn bare_clone(url: &str, path: &str) -> Result<(), String> {
    // Check if path is a valid directory
    if is_repo_cloned(path) {
        log::info!("Repository already exists at: {}", path);
        return Ok(()); // Repository is already cloned, no need to clone again
    }

    log::info!("Cloning repository from {} to {}", url, path);

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
        .clone(url, std::path::Path::new(path))
        .map_err(|e| e.to_string())?;

    log::info!("Repository cloned successfully at: {}", path);
    Ok(())
}

