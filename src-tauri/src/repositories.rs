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
pub fn is_repo_cloned(path: &str) -> bool {
    std::path::Path::new(path).exists()
}

#[tauri::command]
pub async fn bare_clone(url: &str, path: &str, access_token: Option<&str>) -> Result<(), String> {
    // Check if path is a valid directory
    if is_repo_cloned(path) {
        log::info!("Repository already exists at: {path}");
        return Ok(()); // Repository is already cloned, no need to clone again
    }

    log::info!("Cloning repository from {url} to {path}");

    let mut callbacks = RemoteCallbacks::new();
    callbacks.transfer_progress(|progress| {
        clone_progress(progress.received_objects(), progress.total_objects());
        true
    });

    // Set up authentication if access token is provided
    if let Some(token) = access_token {
        callbacks.credentials(|_url, username_from_url, _allowed_types| {
            log::info!("Using access token for authentication");
            git2::Cred::userpass_plaintext("git", token)
        });
    }

    let mut fetch_opts = git2::FetchOptions::new();
    fetch_opts.remote_callbacks(callbacks);

    RepoBuilder::new()
        .bare(true) // Set to true for a bare clone
        .fetch_options(fetch_opts)
        .clone(url, std::path::Path::new(path))
        .map_err(|e| e.to_string())?;

    log::info!("Repository cloned successfully at: {path}");
    Ok(())
}
