use git2::Repository;
use serde::Deserialize;
use serde_json::json;
use std::collections::{HashMap, HashSet};
use std::env;

#[tauri::command]
pub async fn get_ai_summary(path: &str) -> Result<HashMap<String, String>, String> {
    let repo_path_str = path.to_string();
    summarize_all_contributors(&repo_path_str).await
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
        reqwest::StatusCode::UNAUTHORIZED | reqwest::StatusCode::FORBIDDEN | reqwest::StatusCode::BAD_REQUEST => {
            println!("INVALID API KEY");

            if env::var("GEMINI_API_KEY").is_ok() {
                // Removes the previously inputted valid key in case invalid key is entered.
                env::remove_var("GEMINI_API_KEY");
            }
            
            Ok(false)
        }
        status => {
            let body = response.text().await.unwrap_or_default();
            log::error!("Unexpected validation status {}: {}", body, status);
            Ok(false)
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

pub async fn summarize_commits(commits: &str) -> Result<String, reqwest::Error> {
    dotenvy::dotenv().ok();
    let api_key = env::var("GEMINI_API_KEY").expect("GEMINI_API_KEY must be set");

    let models = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash-lite"];

    let prompt = COMMIT_SUMMARY_PROMPT.replace("{commits}", commits);
    let client = reqwest::Client::new();

    for model in &models {
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
            model, api_key
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

        if let Ok(res) = res {
            if let Ok(response_json) = res.json::<GeminiResponse>().await {
                if let Some(candidate) = response_json.candidates.first() {
                    if let Some(part) = candidate.content.parts.first() {
                        return Ok(part.text.clone());
                    }
                }
            }
        }
    }

    Ok(String::from(
        "Could not generate a summary after trying all models.",
    ))
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

pub async fn summarize_all_contributors(
    repo_path: &str,
) -> Result<HashMap<String, String>, String> {
    let mut summaries = HashMap::new();
    if let Ok(contributors) = get_all_contributors(repo_path) {
        for (contributor_name, contributor_email) in contributors {
            if let Ok(commits) = get_contributor_commits(repo_path, &contributor_name) {
                if !commits.is_empty() {
                    match summarize_commits(&commits).await {
                        Ok(summary) => {
                            summaries.insert(contributor_email.clone(), summary);
                        }
                        Err(e) => {
                            eprintln!("Failed to summarize commits for {contributor_name}: {e}")
                        }
                    }
                }
            }
        }
    }
    Ok(summaries)
}
