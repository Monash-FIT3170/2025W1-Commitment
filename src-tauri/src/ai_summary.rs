use git2::Repository;
use serde::Deserialize;
use serde_json::json;
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

pub async fn summarize_commits(commits: &str) -> Result<String, reqwest::Error> {
    dotenvy::dotenv().ok();
    let api_key = env::var("GEMINI_API_KEY").expect("GEMINI_API_KEY must be set");
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={}",
        api_key
    );

    let prompt = format!(
        "Summarize the following commit messages in two sentences, under 20 words total. The summary should describe what this person has been working on. Do not use markdown.\n\nCommit messages:{}",
        commits
    );

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

    Ok("Could not generate a summary.".to_string())
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

pub fn get_all_contributors(repo_path: &str) -> Result<Vec<String>, git2::Error> {
    let repo = Repository::open(repo_path)?;
    let mut revwalk = repo.revwalk()?;
    revwalk.push_head()?;

    let mut contributors = std::collections::HashSet::new();

    for oid in revwalk {
        let oid = oid?;
        let commit = repo.find_commit(oid)?;
        let author_signature = commit.author();
        if let Some(author) = author_signature.name() {
            contributors.insert(author.to_string());
        }
    }
    Ok(contributors.into_iter().collect())
}

pub async fn summarize_all_contributors(repo_path: &str) {
    if let Ok(contributors) = get_all_contributors(repo_path) {
        for contributor in contributors {
            if let Ok(commits) = get_contributor_commits(repo_path, &contributor) {
                if !commits.is_empty() {
                    println!("--- Summarizing commits for {} ---", contributor);
                    match summarize_commits(&commits).await {
                        Ok(summary) => println!("{}", summary),
                        Err(e) => {
                            eprintln!("Failed to summarize commits for {}: {}", contributor, e)
                        }
                    }
                }
            }
        }
    }
}
