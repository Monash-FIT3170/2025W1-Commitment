use git2::{build::RepoBuilder, RemoteCallbacks};
// use std::time::Duration;

fn clone_progress(cur_progress: usize, total_progress: usize) {
    print!("\rProgress: {cur_progress}/{total_progress}");
}

#[tauri::command(rename_all = "snake_case")]
pub fn try_clone_with_token(url: &str, path: &str, token: Option<&str>, depth: Option<i32>) -> Result<(), String> {
    log::info!("Starting try_clone_with_token: {url} -> {path}");

    let mut callbacks = RemoteCallbacks::new();
    callbacks.transfer_progress(|progress| {
        clone_progress(progress.received_objects(), progress.total_objects());
        true
    });

    // Set up authentication if token is provided
    let token_owned = token.map(|t| t.to_string());
    if let Some(ref access_token) = token_owned {
        let token_clone = access_token.clone();
        callbacks.credentials(move |_url, _username_from_url, _allowed_types| {
            log::info!("Attempting authentication with token");
            git2::Cred::userpass_plaintext("git", &token_clone)
        });
    }

    let mut fetch_opts = git2::FetchOptions::new();
    fetch_opts.remote_callbacks(callbacks);

    // Set depth if provided
    if let Some(d) = depth {
        fetch_opts.depth(d);
    }

    let mut repo_builder = RepoBuilder::new();
    repo_builder.bare(true).fetch_options(fetch_opts);

    // When depth is specified, we need to manually configure the remote to only fetch
    // the default branch. Without this, FetchOptions::depth fetches depth-limited
    // commits from ALL branches, which is undesirable.
    let result = if depth.is_some() {
        repo_builder.remote_create(|repo, name, url| {
            // Create a temporary remote to discover the default branch
            let mut remote = repo.remote(name, url)?;

            // Set up callbacks for authentication during connection
            let mut connect_callbacks = RemoteCallbacks::new();
            if let Some(ref access_token) = token_owned {
                let token_clone = access_token.clone();
                connect_callbacks.credentials(move |_url, _username_from_url, _allowed_types| {
                    log::info!("Attempting authentication with token during connect");
                    git2::Cred::userpass_plaintext("git", &token_clone)
                });
            }

            // Connect to discover the default branch WITHOUT fetching any data
            remote.connect_auth(git2::Direction::Fetch, Some(connect_callbacks), None)?;
            let head_name_buf = remote.default_branch()?;
            remote.disconnect()?;

            // Parse the default branch name
            let head_ref = std::str::from_utf8(&head_name_buf)
                .map_err(|e| git2::Error::from_str(&format!("Invalid UTF-8 in branch name: {e}")))?;
            let head_str = head_ref.strip_prefix("refs/heads/").unwrap_or(head_ref);

            // Create a refspec that only fetches the default branch
            let refspec = format!("+refs/heads/{head_str}:refs/remotes/{name}/{head_str}");

            // Delete the temporary remote
            repo.remote_delete(name)?;

            // Create the remote with the restricted refspec
            repo.remote_with_fetch(name, url, refspec.as_str())
        })
        .clone(url, std::path::Path::new(path))
    } else {
        // For clones without depth, use the standard approach
        repo_builder.clone(url, std::path::Path::new(path))
    };

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
            log::error!("Code: {:?}", e.code());
            log::error!("Class: {:?}", e.class());
            log::error!("Msg: {}", e.message());

            // Check if this is an authentication error and normalize the message
            // so the frontend can detect it consistently
            if e.code() == git2::ErrorCode::Auth {
                Err("remote authentication required".to_string())
            } else {
                Err(e.to_string())
            }
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
pub fn is_repo_cloned(path: &str) -> bool {
    std::path::Path::new(path).exists()
}

#[tauri::command(rename_all = "snake_case")]
pub fn delete_repo(path: &str) -> Result<(), String> {
    log::info!("Attempting to delete repository at: {path}");

    let repo_path = std::path::Path::new(path);

    if !repo_path.exists() {
        log::warn!("Repository path does not exist: {path}");
        return Ok(()); // Consider it successfully deleted if it doesn't exist
    }

    match std::fs::remove_dir_all(repo_path) {
        Ok(()) => {
            log::info!("Successfully deleted repository at: {path}");
            Ok(())
        }
        Err(e) => {
            log::error!("Failed to delete repository at {path}: {e}");
            Err(format!("Failed to delete repository: {e}"))
        }
    }
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
pub async fn bare_clone(url: &str, path: &str, depth: Option<i32>) -> Result<(), String> {
    // Check if path already exists
    if is_repo_cloned(path) {
        log::info!("Repository already exists at: {path}");
        return Ok(());
    }

    log::info!("Cloning repository from {url} to {path}");

    // Step 1: Try cloning without authentication (public repository)
    log::info!("Attempting to clone as public repository");
    match try_clone_with_token(url, path, None, depth) {
        Ok(()) => {
            log::info!("Successfully cloned public repository at: {path}");
            Ok(())
        }
        Err(e) => {
            let err_msg = format!("Clone failed: {e}. Checking if private.");
            log::error!("{err_msg}");
            Err(err_msg)
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn refresh_repo(url: &str, path: &str, depth: Option<i32>) -> Result<(), String> {
    log::info!("Refreshing repository at: {path}");

    // Step 1: Delete the existing repository
    if is_repo_cloned(path) {
        log::info!("Deleting existing repository at: {path}");
        delete_repo(path)?;
    }

    // Step 2: Re-clone the repository using bare_clone
    log::info!("Re-cloning repository from {url} to {path}");
    bare_clone(url, path, depth).await
}

// Function used to determine if the repository exists online or not
// async fn check_repo_exists_online(url: &str) -> Result<bool, String> {

//     // Set-up reqwest client
//     let client = reqwest::Client::builder()
//         .timeout(Duration::from_secs(30)) //Set a timeout of 30 seconds
//         .connect_timeout(Duration::from_secs(10))// Set a connection timeout of 10 seconds
//         .build()
//         .map_err(|e| format!("Failed to build client: {}", e))?;

//     let result = client.get(url)
//         .send()
//         .await
//         .map_err(|e| format!("Request failed: {}", e))?;

//     log::info!("Received status code: {}", result.status());
//     match result.status() {
//         reqwest::StatusCode::OK | reqwest::StatusCode::FORBIDDEN | reqwest::StatusCode::UNAUTHORIZED => Ok(true),
//         reqwest::StatusCode::NOT_FOUND => Ok(false),
//         status => Err(format!("Unexpected status code: {}", status)),
//     }

// }
