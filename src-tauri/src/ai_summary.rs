use git2::Repository;
use serde::Deserialize;
use serde_json::json;
use std::collections::{HashMap, HashSet};
use std::env;

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
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    );

    let prompt = COMMIT_SUMMARY_PROMPT.replace("{commits}", commits);

    let client = reqwest::Client::new();
    let res = client
        .post(&url)
        .json(&json!({
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }))
        .send()
        .await?;

    let response_json: GeminiResponse = res.json().await?;

    if let Some(candidate) = response_json.candidates.first() {
        if let Some(part) = candidate.content.parts.first() {
            return Ok(part.text.clone());
        }
    }

    Ok(String::from("Could not generate a summary."))
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
