use git2::{build::RepoBuilder, RemoteCallbacks};

fn clone_progress(cur_progress: usize, total_progress: usize) {
    println!("\rProgress: {cur_progress}/{total_progress}");
}

#[tauri::command(rename_all = "snake_case")]
pub fn try_clone_with_token(url: &str, path: &str, token: Option<&str>) -> Result<(), String> {
    log::info!("Starting try_clone_with_token: {url} -> {path}");

    let mut callbacks = RemoteCallbacks::new();
    callbacks.transfer_progress(|progress| {
        clone_progress(progress.received_objects(), progress.total_objects());
        true
    });

    // Set up authentication if token is provided
    if let Some(access_token) = token {
        let token_owned = access_token.to_string();
        callbacks.credentials(move |_url, _username_from_url, _allowed_types| {
            log::info!("Attempting authentication with token");
            git2::Cred::userpass_plaintext("git", &token_owned)
        });
    }

    let mut fetch_opts = git2::FetchOptions::new();
    fetch_opts.remote_callbacks(callbacks);

    log::info!("Starting clone operation...");

    let result = RepoBuilder::new()
        .bare(true)
        .fetch_options(fetch_opts)
        .clone(url, std::path::Path::new(path));

    match result {
        Ok(_repo) => {
            log::info!("Clone completed successfully to {path}");

            // Verify the directory was created
            if std::path::Path::new(path).exists() {
                log::info!("Repository directory confirmed to exist at {path}");
            } else {
                log::warn!("Repository directory does not exist after clone: {path}");
            }

            Ok(())
        }
        Err(e) => {
            log::error!("Clone failed with error: {e}");
            Err(e.to_string())
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
pub fn is_repo_cloned(path: &str) -> bool {
    std::path::Path::new(path).exists()
}

#[tauri::command(rename_all = "snake_case")]
pub fn get_local_repo_information(path: &str) -> Result<String, String> {
    if !is_repo_cloned(path) {
        log::info!("No repository found at: {path}");
        return Err("No repository found".into());
    }

    // Returns the name and owner of the repository if it can be opened

    match git2::Repository::open(path) {
        Ok(repo) => {
            if let Ok(remote) = repo.find_remote("origin") {
                if let Some(url) = remote.url() {
                    return Ok(url.to_string());
                }
            }
            Err(format!(
                "Failed to open repository at {path}: No origin remote found"
            ))
        }
        Err(e) => {
            log::error!("Failed to open repository at {path}: {e}");
            Err(format!("Failed to open repository: {e}"))
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn bare_clone(url: &str, path: &str) -> Result<(), String> {
    // Check if path already exists
    if is_repo_cloned(path) {
        log::info!("Repository already exists at: {path}");
        return Ok(());
    }

    log::info!("Cloning repository from {url} to {path}");

    // Step 1: Try cloning without authentication (public repository)
    log::info!("Attempting to clone as public repository");
    match try_clone_with_token(url, path, None) {
        Ok(()) => {
            log::info!("Successfully cloned public repository at: {path}");
            return Ok(());
        }
        Err(e) => {
            log::info!("Public clone failed: {e}. Trying with access tokens");
        }
    }

    // Step 4: Repository is private and requires authentication
    Err("Repository appears to be private and requires authentication. Please use try_clone_with_token with a valid access token.".to_string())
}
