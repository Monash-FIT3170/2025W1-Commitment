use git2::{BranchType, Oid, Repository, Sort};
use log::info;
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

fn generate_initials(name: &str) -> String {
    name.split_whitespace()
        .map(|s| s.chars().next().unwrap_or('?').to_ascii_uppercase())
        .collect::<String>()
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum Contacts {
    Email(String),
    EmailList(Vec<String>),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Contributor {
    pub username: String,
    pub contacts: Contacts,
    pub total_commits: u64,
    pub additions: u64,
    pub deletions: u64,
    pub profile_colour: String,
    pub username_initials: String,
    pub total_regex_matches: usize,
    pub commits_matching_regex: u64,
    pub ai_summary: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DateRange {
    pub start: i64,
    pub end: i64,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn group_contributors_by_config(
    config_json: Value,
    contributors: Vec<Contributor>,
) -> Result<Vec<Contributor>, String> {
    let mut result: Vec<Contributor> = Vec::new();

    // Collect emails from config for grouping
    let mut grouped_emails = std::collections::HashSet::new();
    if let Value::Object(ref map) = config_json {
        for (group_name, emails_value) in map.iter() {
            let mut total_commits = 0;
            let mut additions = 0;
            let mut deletions = 0;
            let mut contacts = Vec::new();
            let mut total_regex_matches = 0;
            let mut commits_matching_regex = 0;
            let ai_summary = String::new();

            let mut processed_contributors = std::collections::HashSet::new();

            if let Value::Array(email_list) = emails_value {
                // First pass: collect all emails in this group
                let group_emails: std::collections::HashSet<String> = email_list
                    .iter()
                    .filter_map(|email_val| email_val.as_str())
                    .map(|email| email.to_string())
                    .collect();

                // Add all group emails to the global grouped_emails set
                for email in &group_emails {
                    grouped_emails.insert(email.clone());
                }

                // Second pass: find contributors that have ANY email in this group
                // but ensure each contributor is only processed ONCE per group
                for contrib in contributors.iter() {
                    let contributor_emails = match &contrib.contacts {
                        Contacts::Email(e) => vec![e.clone()],
                        Contacts::EmailList(list) => list.clone(),
                    };

                    // Check if this contributor has any email that matches this group
                    let has_matching_email = contributor_emails
                        .iter()
                        .any(|email| group_emails.contains(email));

                    if has_matching_email {
                        // Use contributor's username as unique identifier to prevent duplicates
                        let contributor_id =
                            format!("{}|{}", contrib.username, contributor_emails.join(","));

                        if !processed_contributors.contains(&contributor_id) {
                            processed_contributors.insert(contributor_id);

                            total_commits += contrib.total_commits;
                            additions += contrib.additions;
                            deletions += contrib.deletions;
                            total_regex_matches += contrib.total_regex_matches;
                            commits_matching_regex += contrib.commits_matching_regex;

                            // Add all matching emails from this contributor to contacts
                            for email in contributor_emails.iter() {
                                if group_emails.contains(email) && !contacts.contains(email) {
                                    contacts.push(email.clone());
                                }
                            }
                        }
                    }
                }
            }

            // Generate initials and profile color from the group name (mapped username)
            let username_initials = generate_initials(group_name);
            let profile_bg_colour = generate_profile_bg_colour(group_name);

            if !contacts.is_empty() {
                result.push(Contributor {
                    username: group_name.clone(),
                    contacts: Contacts::EmailList(contacts),
                    total_commits,
                    additions,
                    deletions,
                    profile_colour: profile_bg_colour,
                    username_initials,
                    total_regex_matches,
                    commits_matching_regex,
                    ai_summary,
                });
            }
        }
    }

    // Add contributors not included in config
    for c in &contributors {
        let mut is_grouped = false;
        match &c.contacts {
            Contacts::Email(email) => {
                if grouped_emails.contains(email) {
                    is_grouped = true;
                }
            }
            Contacts::EmailList(list) => {
                if list.iter().any(|e| grouped_emails.contains(e)) {
                    is_grouped = true;
                }
            }
        }

        if !is_grouped {
            result.push(c.clone());
        }
    }

    Ok(result)
}

// date_range: Option<(i64, i64)> - Optional date range in UNIX timestamp format
#[tauri::command(rename_all = "snake_case")]
pub async fn get_contributor_info(
    path: &str,
    branch: Option<&str>,
    date_range: Option<DateRange>,
    regex_query: Option<&str>,
) -> Result<HashMap<String, Contributor>, String> {
    let canonical_path = std::path::Path::new(path)
        .canonicalize()
        .map_err(|e| e.to_string())?;

    let repo = match Repository::open(canonical_path) {
        Ok(repo) => {
            log::info!("Successfully opened repository at {path}");
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
                log::error!("Branch: {target} not found in the repository.");
                return Err(format!("Branch: {target} not found in the repository."));
            }
            find_branch_oid(&repo, target)?
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

    let rgx = regex_query.map(|rgx_str| Regex::new(rgx_str).map_err(|e| e.to_string()));

    for oid_result in revwalk {
        let oid = oid_result.map_err(|e| e.to_string())?;
        let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;
        let time = commit.time().seconds();

        if let Some(ref date_range) = date_range {
            // Check if commit time is within the specified date range
            if time < date_range.start || time > date_range.end {
                continue;
            }
        }

        let author_signature = commit.author();
        let email = author_signature.email().unwrap_or("").to_string();
        let username = author_signature.name().unwrap_or("unknown");
        let initials = generate_initials(username);
        let profile_bg_colour = generate_profile_bg_colour(username);

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

        let total_matches = if regex_query.is_some() {
            let commit_msg = commit.message_raw().unwrap_or("");
            let id = commit.id().to_string().chars().take(6).collect::<String>();
            let re = rgx.clone().unwrap()?;
            re.find_iter(commit_msg)
                .inspect(|m| {
                    info!("{id} :: {}", m.as_str());
                })
                .count()
        } else {
            0
        };

        let entry = contributors
            .entry(username.to_string())
            .or_insert_with(|| Contributor {
                username: username.to_string(),
                contacts: Contacts::EmailList(vec![email.clone()]),
                total_commits: 0,
                additions: 0,
                deletions: 0,
                profile_colour: profile_bg_colour,
                username_initials: initials,
                total_regex_matches: 0,
                commits_matching_regex: 0,
                ai_summary: String::from(""),
            });

        // Add email to contacts if not already present
        match &mut entry.contacts {
            Contacts::EmailList(list) => {
                if !list.contains(&email) {
                    list.push(email.clone());
                }
            }
            Contacts::Email(existing) => {
                if existing != &email {
                    *entry = Contributor {
                        username: username.to_string(),
                        contacts: Contacts::EmailList(vec![existing.clone(), email.clone()]),
                        total_commits: entry.total_commits,
                        additions: entry.additions,
                        deletions: entry.deletions,
                        profile_colour: entry.profile_colour.clone(),
                        username_initials: entry.username_initials.clone(),
                        total_regex_matches: entry.total_regex_matches,
                        commits_matching_regex: entry.commits_matching_regex,
                        ai_summary: String::from(""),
                    };
                }
            }
        }

        entry.total_commits += 1;
        entry.additions += additions;
        entry.deletions += deletions;
        entry.total_regex_matches += total_matches;

        if total_matches > 0 {
            entry.commits_matching_regex += 1;
        }
    }

    Ok(contributors)
}

fn find_branch_oid(repo: &Repository, branch: &str) -> Result<Oid, String> {
    // Try local branch first
    if let Ok(branch_ref) = repo.find_branch(branch, BranchType::Local) {
        return branch_ref
            .get()
            .target()
            .ok_or("Invalid local branch target".to_string());
    }
    // Try remote branch (origin/<branch>)
    let remote_branch_name = format!("refs/remotes/{branch}");
    if let Ok(reference) = repo.find_reference(&remote_branch_name) {
        return reference
            .target()
            .ok_or("Invalid remote branch target".to_string());
    }
    Err(format!("Branch '{branch}' not found as local or remote"))
}

fn generate_profile_bg_colour(username: &str) -> String {
    let hash = username.as_bytes().iter().fold(0usize, |hash, byte| {
        (*byte as usize) + (hash << 5).wrapping_sub(hash)
    });

    let r: u8 = u8::try_from(hash & 0xff).unwrap_or(0);
    let g: u8 = u8::try_from((hash >> 8) & 0xff).unwrap_or(0);
    let b: u8 = u8::try_from((hash >> 16) & 0xff).unwrap_or(0);

    format!("#{r:02x}{g:02x}{b:02x}")
}
