use crate::ai_summary;
use std::collections::HashMap;
use std::env;

#[tauri::command]
pub async fn get_ai_summary(path: &str) -> Result<HashMap<String, String>, String> {
    let repo_path_str = path.to_string();
    ai_summary::summarize_all_contributors(&repo_path_str).await
}

#[tauri::command]
pub fn check_key_set() -> bool {
    dotenvy::dotenv().ok();
    env::var("GEMINI_API_KEY").is_ok()
}

#[tauri::command]
pub async fn gemini_key_validation(api_key: String) -> Result<bool, String> {
    println!("Validating Gemini API key...");
    let url: &str = "https://generativelanguage.googleapis.com/v1/models";

    let client = reqwest::Client::new();

    let response = client
        .get(url)
        .query(&[("key", &api_key)])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    // Debugging: Check response status
    println!("Response Status: {}", response.status());

    match response.status() {
        reqwest::StatusCode::OK => {
            println!("VALID API KEY");
            env::set_var("GEMINI_API_KEY", &api_key);
            Ok(true)
        }
        reqwest::StatusCode::UNAUTHORIZED | reqwest::StatusCode::FORBIDDEN => Ok(false),
        status => {
            let body = response.text().await.unwrap_or_default();
            log::error!("Unexpected validation status {}: {}", body, status);
            Ok(false)
        }
    }
}
