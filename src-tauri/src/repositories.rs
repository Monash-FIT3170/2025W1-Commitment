use git2::{build::RepoBuilder, RemoteCallbacks};
use std::env;

fn clone_progress(cur_progress: usize, total_progress: usize) {
    println!("\rProgress: {cur_progress}/{total_progress}");
}

fn load_access_tokens_from_env() -> Vec<String> {
    let mut tokens = Vec::new();
    
    // Load .env file if it exists
    if let Err(e) = dotenvy::dotenv() {
        log::warn!("Could not load .env file: {}", e);
    }
    
    // Try to load multiple token environment variables
    let token_vars = ["GITHUB_TOKEN", "GITLAB_TOKEN"];
    
    for var in token_vars.iter() {
        if let Ok(token) = env::var(var) {
            if !token.is_empty() {
                log::info!("Loaded token from {}", var);
                tokens.push(token);
            }
        }
    }
    
    if tokens.is_empty() {
        log::warn!("No access tokens found in environment variables");
    } else {
        log::info!("Loaded {} access token(s) from environment", tokens.len());
    }
    
    tokens
}

#[tauri::command]
pub fn try_clone_with_token(url: &str, path: &str, token: Option<&str>) -> Result<(), String> {
    log::info!("Starting try_clone_with_token: {} -> {}", url, path);
    
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
            log::info!("Clone completed successfully to {}", path);
            
            // Verify the directory was created
            if std::path::Path::new(path).exists() {
                log::info!("Repository directory confirmed to exist at {}", path);
            } else {
                log::warn!("Repository directory does not exist after clone: {}", path);
            }
            
            Ok(())
        }
        Err(e) => {
            log::error!("Clone failed with error: {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub fn is_repo_cloned(path: &str) -> bool {
    std::path::Path::new(path).exists()
}


#[tauri::command]
pub async fn bare_clone(url: &str, path: &str) -> Result<(), String> {
    // Check if path already exists
    if is_repo_cloned(path) {
        log::info!("Repository already exists at: {}", path);
        return Ok(());
    }

    log::info!("Cloning repository from {} to {}", url, path);

    // Step 1: Try cloning without authentication (public repository)
    log::info!("Attempting to clone as public repository");
    match try_clone_with_token(url, path, None) {
        Ok(()) => {
            log::info!("Successfully cloned public repository at: {}", path);
            return Ok(());
        }
        Err(e) => {
            log::info!("Public clone failed: {}. Trying with access tokens", e);
        }
    }

    // Step 2: Load access tokens from environment
    let tokens = load_access_tokens_from_env();
    if tokens.is_empty() {
        return Err(
            "Repository appears to be private, but no access tokens found in environment variables. \
            Please add GITHUB_TOKEN or GITLAB_TOKEN to your .env file."
                .to_string(),
        );
    }

    // Step 3: Try each token until one works
    let mut last_error = String::new();
    for (index, token) in tokens.iter().enumerate() {
        log::info!("Attempting clone with token {} of {}", index + 1, tokens.len());
        
        match try_clone_with_token(url, path, Some(token)) {
            Ok(()) => {
                log::info!("Successfully cloned private repository at: {}", path);
                return Ok(());
            }
            Err(e) => {
                last_error = e.to_string();
                log::warn!("Token {} failed: {}", index + 1, last_error);
                
                // Clean up any partial clone attempt
                if std::path::Path::new(path).exists() {
                    let _ = std::fs::remove_dir_all(path);
                }
            }
        }
    }

    // Step 4: All tokens failed
    Err(format!(
        "Failed to clone repository. All {} access tokens were tried but none worked. \
        This could mean: 1) You don't have access to this private repository, \
        2) The tokens are invalid or expired, or 3) The repository doesn't exist. \
        Last error: {}",
        tokens.len(),
        last_error
    ))
}
