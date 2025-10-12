use git2::{Repository, Sort};
use serde::Deserialize;
use serde_json::{json, Value};
use std::collections::{HashMap, HashSet};
use std::env;
use std::time::Duration;
use tauri::Emitter;

#[derive(Clone, serde::Serialize)]
struct SummaryProgress {
    email: String,
    summary: String,
}

#[tauri::command]
pub async fn get_ai_summary(window: tauri::Window, path: &str) -> Result<(), String> {
    match get_all_contributors(path) {
        Ok(contributors) => {
            let total = contributors.len();

            if total == 0 {
                let msg = format!("No contributors found in the repository at path: {path}");
                log::error!("{msg}");
                return Err(msg);
            }

            window.emit("summary-total", total).unwrap();

            for (contributor_name, contributor_email) in contributors {
                if let Ok(commits) = get_contributor_commits(path, &contributor_name) {
                    if !commits.is_empty() {
                        match summarize_commits(&commits).await {
                            Ok(summary) => {
                                let progress = SummaryProgress {
                                    email: contributor_email.clone(),
                                    summary,
                                };

                                window.emit("summary-progress", progress).unwrap();
                            }
                            Err(e) => {
                                let err_msg = e.to_string();
                                Err(err_msg)?
                            }
                        }
                    }
                }
            }
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to get contributors for path {path}: {e}");
            log::error!("{msg}");
            Err(msg)
        }
    }
}

#[tauri::command]
pub async fn get_ai_summary_with_config(
    window: tauri::Window,
    path: &str,
    config_json: Value,
) -> Result<(), String> {
    match get_squashed_commits_by_config(path, config_json.clone()).await {
        Ok(squashed_commits) => {
            let total = squashed_commits.len();

            if total == 0 {
                let msg = format!("No contributors found in config for repository at path: {path}");
                log::error!("{msg}");
                return Err(msg);
            }

            window.emit("summary-total", total).unwrap();

            // Get email mapping from config
            let mut user_to_emails: HashMap<String, Vec<String>> = HashMap::new();
            if let Value::Object(ref map) = config_json {
                for (user_name, emails_value) in map.iter() {
                    if let Value::Array(email_list) = emails_value {
                        let emails: Vec<String> = email_list
                            .iter()
                            .filter_map(|v| v.as_str().map(|s| s.to_string()))
                            .collect();
                        user_to_emails.insert(user_name.clone(), emails);
                    }
                }
            }

            for (user_name, commit_data) in squashed_commits {
                if !commit_data.is_empty() {
                    match summarize_commits(&commit_data).await {
                        Ok(summary) => {
                            // Send progress for each email associated with this user
                            if let Some(emails) = user_to_emails.get(&user_name) {
                                for email in emails {
                                    let progress = SummaryProgress {
                                        email: email.clone(),
                                        summary: summary.clone(),
                                    };
                                    window.emit("summary-progress", progress).unwrap();
                                }
                            }
                        }
                        Err(e) => {
                            let err_msg = e.to_string();
                            Err(err_msg)?
                        }
                    }
                }
            }
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to get squashed commits for path {path}: {e}");
            log::error!("{msg}");
            Err(msg)
        }
    }
}

#[tauri::command]
pub fn check_key_set() -> bool {
    dotenvy::dotenv().ok();
    env::var("GEMINI_API_KEY").is_ok()
}

#[tauri::command]
pub async fn gemini_key_validation(api_key: String) -> Result<bool, String> {
    log::info!("Validating Gemini API key...");
    let url: &str = "https://generativelanguage.googleapis.com/v1/models";

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30)) //Set a timeout of 30 seconds
        .connect_timeout(Duration::from_secs(10)) // Set a connection timeout of 10 seconds
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(url)
        .query(&[("key", &api_key)])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    match response.status() {
        reqwest::StatusCode::OK => {
            log::info!("VALID API KEY");
            env::set_var("GEMINI_API_KEY", &api_key);
            Ok(true)
        }
        reqwest::StatusCode::UNAUTHORIZED
        | reqwest::StatusCode::FORBIDDEN
        | reqwest::StatusCode::BAD_REQUEST => {
            log::info!("INVALID API KEY");

            if env::var("GEMINI_API_KEY").is_ok() {
                // Removes the previously inputted valid key in case invalid key is entered.
                env::remove_var("GEMINI_API_KEY");
            }

            Ok(false)
        }
        status => {
            let body = response.text().await.unwrap_or_default();
            log::error!("Unexpected validation status {body}: {status}");
            Err(format!("Unexpected status: {status}"))
        }
    }
}

#[derive(Deserialize)]
struct GeminiResponse {
    candidates: Vec<Candidate>,
}

#[derive(Deserialize)]
struct Candidate {
    content: Content,
}

#[derive(Deserialize)]
struct Content {
    parts: Vec<Part>,
}

#[derive(Deserialize)]
struct Part {
    text: String,
}

const COMMIT_SUMMARY_PROMPT: &str = include_str!("AI-summary-prompt.md");

pub async fn summarize_commits(commits: &str) -> Result<String, String> {
    dotenvy::dotenv().ok();
    let api_key = env::var("GEMINI_API_KEY").expect("GEMINI_API_KEY must be set");

    let models = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.5-flash-lite",
    ];

    let prompt = COMMIT_SUMMARY_PROMPT.replace("{commits}", commits);
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30)) //Set a timeout of 30 seconds
        .connect_timeout(Duration::from_secs(10)) // Set a connection timeout of 10 seconds
        .build()
        .map_err(|e| format!("Failed to build client: {e}"))?;

    let mut last_error: Option<String> = None;

    for model in &models {
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        );

        let res = client
            .post(&url)
            .json(&json!({
                "contents": [{
                    "parts": [{"text": &prompt}]
                }]
            }))
            .send()
            .await;

        match res {
            Ok(response) => match response.json::<GeminiResponse>().await {
                Ok(response_json) => {
                    if let Some(candidate) = response_json.candidates.first() {
                        if let Some(part) = candidate.content.parts.first() {
                            return Ok(part.text.clone());
                        }
                    }
                    last_error = Some(format!("Empty response from model {model}"));
                    log::error!("{last_error:?}");
                }
                Err(e) => {
                    last_error = Some(format!("Failed to parse response from model {model}: {e}"));
                    log::error!("{last_error:?}");
                }
            },
            Err(e) => {
                let error_msg = if e.is_timeout() {
                    format!("Request to model {model} timed out")
                } else if e.is_connect() {
                    "Network connection error. Please check internet connection.".to_string()
                } else if e.is_request() {
                    format!("Request error to model {model}. Please try again.")
                } else {
                    format!("Request to model {model} failed. Unknown Error: {e}")
                };
                log::error!("{error_msg}");
                last_error = Some(error_msg);
            }
        }
    }

    // Err(String::from(
    //     "Failed to generate summary. Check internet connection or API key validity.",
    // ))

    Err(last_error.unwrap_or_else(|| {
        String::from("Failed to generate summary. Check internet connection or API key validity.")
    }))
}

pub fn get_contributor_commits(
    repo_path: &str,
    contributor_name: &str,
) -> Result<String, git2::Error> {
    let repo = Repository::open(repo_path)?;
    let mut revwalk = repo.revwalk()?;
    revwalk.push_head()?;

    let mut commits = String::new();
    let mut count = 0;

    for oid in revwalk {
        if count >= 10 {
            break;
        }

        let oid = oid?;
        let commit = repo.find_commit(oid)?;
        let author_signature = commit.author();

        if let Some(author) = author_signature.name() {
            if author == contributor_name {
                if let Some(message) = commit.summary() {
                    commits.push_str(message);
                    commits.push('\n');
                    count += 1;
                }
            }
        }
    }

    Ok(commits)
}

pub fn get_all_contributors(repo_path: &str) -> Result<HashSet<(String, String)>, git2::Error> {
    let repo = Repository::open(repo_path)?;
    let mut revwalk = repo.revwalk()?;
    revwalk.push_head()?;

    let mut contributors = HashSet::new();

    for oid in revwalk {
        let oid = oid?;
        let commit = repo.find_commit(oid)?;
        let author_signature = commit.author();

        if let (Some(author), Some(email)) = (author_signature.name(), author_signature.email()) {
            contributors.insert((String::from(author), String::from(email)));
        }
    }

    Ok(contributors)
}

pub async fn get_squashed_commits_by_config(
    repo_path: &str,
    config_json: Value,
) -> Result<HashMap<String, String>, git2::Error> {
    let repo = Repository::open(repo_path)?;
    let mut revwalk = repo.revwalk()?;
    revwalk.push_head()?;
    revwalk.set_sorting(Sort::TIME)?;

    let mut email_to_user: HashMap<String, String> = HashMap::new();

    if let Value::Object(ref map) = config_json {
        for (user_name, emails_value) in map.iter() {
            if let Value::Array(email_list) = emails_value {
                for email_val in email_list {
                    if let Some(email) = email_val.as_str() {
                        email_to_user.insert(email.to_string(), user_name.clone());
                    }
                }
            }
        }
    }

    let mut user_commits: HashMap<String, Vec<(i64, String)>> = HashMap::new();

    for oid in revwalk {
        let oid = oid?;
        let commit = repo.find_commit(oid)?;
        let author_signature = commit.author();

        if let Some(email) = author_signature.email() {
            if let Some(user_name) = email_to_user.get(email) {
                if let Some(message) = commit.summary() {
                    let commit_time = commit.time().seconds();
                    user_commits
                        .entry(user_name.clone())
                        .or_default()
                        .push((commit_time, message.to_string()));
                }
            }
        }
    }

    let mut result: HashMap<String, String> = HashMap::new();

    for (user_name, mut commits) in user_commits {
        commits.sort_by(|a, b| a.0.cmp(&b.0));

        let squashed_commits = commits
            .iter()
            .map(|(_, message)| message.clone())
            .collect::<Vec<String>>()
            .join("\n");

        result.insert(user_name, squashed_commits);
    }

    Ok(result)
}
