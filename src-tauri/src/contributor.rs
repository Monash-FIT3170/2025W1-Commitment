use git2::{BranchType, Repository, Sort};
use serde::{Deserialize, Serialize};

use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug)]
pub enum Contacts {
    Email(String),
    EmailList(Vec<String>),
}

#[derive(Debug, Serialize)]
pub struct Contributor {
    pub username: String,
    pub contacts: Contacts,
    pub total_commits: u64,
    pub additions: u64,
    pub deletions: u64,
    // pub changes: u64,
    pub bitmap_hash: String,
    pub bitmap: String, // tmp until using actual bitmap type
}

// date_range: Option<(i64, i64)> - Optional date range in UNIX timestamp format
#[tauri::command]
pub async fn get_contributor_info(
    path: &str,
    branch: Option<&str>,
    date_range: Option<(i64, i64)>,
) -> Result<HashMap<String, Contributor>, String> {
    let canonical_path = std::path::Path::new(path)
        .canonicalize()
        .map_err(|e| e.to_string())?;

    let repo = match Repository::open(canonical_path) {
        Ok(repo) => {
            log::info!("Successfully opened repository at {}", path);
            repo
        }
        Err(e) => {
            return Err(format!(
                "Error: {e}. Occurred when attempting to opening repository."
            ))
        }
    };

    let mut branches: Vec<String> = Vec::new();
    for branch in repo.branches(None).map_err(|e| e.to_string())? {
        let (branch, _branch_type) = branch.map_err(|e| e.to_string())?;
        if let Some(name) = branch.name().map_err(|e| e.to_string())? {
            branches.push(name.to_string());
        }
    }

    // Resolve branch reference
    let mut revwalk = repo.revwalk().map_err(|e| e.to_string())?;
    let head = match branch {
        Some(target) => {
            // Ensure the branch exists before proceeding
            if !branches.contains(&target.to_string()) {
                log::error!("Branch: {} not found in the repository.", target);
                return Err(format!("Branch: {} not found in the repository.", target));
            }
            repo.find_branch(target, BranchType::Local)
                .map_err(|e| e.to_string())?
                .get()
                .target()
                .ok_or(git2::Error::from_str("Invalid branch head"))
                .map_err(|e| e.to_string())?
        }
        None => repo
            .head()
            .map_err(|e| e.to_string())?
            .target()
            .ok_or(git2::Error::from_str("Invalid HEAD"))
            .map_err(|e| e.to_string())?,
    };

    revwalk.push(head).map_err(|e| e.to_string())?;
    revwalk.set_sorting(Sort::TIME).map_err(|e| e.to_string())?;

    let mut contributors: HashMap<String, Contributor> = HashMap::new();

    for oid_result in revwalk {
        let oid = oid_result.map_err(|e| e.to_string())?;
        let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;
        let time = commit.time().seconds();

        if let Some((start, end)) = date_range {
            if time < start || time > end {
                continue; // Skip commits outside the date range
            }
        }

        let author_signature = commit.author();
        let email = author_signature.email().unwrap_or("").to_string();
        let gravatar_hash = md5::compute(email.clone().trim().to_lowercase());
        let gravatar_login = author_signature.name().unwrap_or("Unknown").to_string();
        let gravatar_url = format!(
            "https://www.gravatar.com/avatar/{:x}?d=identicon",
            gravatar_hash
        );

        let commit_tree = commit.tree().map_err(|e| e.to_string())?;
        let parent_tree = if commit.parent_count() > 0 {
            Some(
                commit
                    .parent(0)
                    .map_err(|e| e.to_string())?
                    .tree()
                    .map_err(|e| e.to_string())?,
            )
        } else {
            None
        };

        let diff = repo
            .diff_tree_to_tree(parent_tree.as_ref(), Some(&commit_tree), None)
            .map_err(|e| e.to_string())?;
        let stats = diff.stats().map_err(|e| e.to_string())?;

        let additions = stats.insertions() as u64;
        let deletions = stats.deletions() as u64;

        let entry = contributors
            .entry(email.clone())
            .or_insert_with(|| Contributor {
                username: String::from(""),
                contacts: Contacts::Email(email),
                total_commits: 0,
                additions: 0,
                deletions: 0,
                bitmap_hash: gravatar_login, // tmp use to store gravatar login
                bitmap: gravatar_url,        // tmp use to store gravatar url
            });

        entry.total_commits += 1;
        entry.additions += additions;
        entry.deletions += deletions;
    }

    Ok(contributors)
}
