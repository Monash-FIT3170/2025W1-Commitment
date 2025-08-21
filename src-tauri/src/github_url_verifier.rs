use serde::Serialize;
use regex::Regex;
use std::path::Path; // Added for local path manipulation

#[derive(Serialize, Debug)]
pub struct SourceInfo { // Renamed from GithubInfo
    pub owner: String, // For git hosts: owner/group. For local: parent directory.
    pub repo: String,  // For git hosts: repo name. For local: file/directory name.
    pub source_type: i32, // 0 for GitHub, 1 for GitLab, 2 for Local File
}

#[tauri::command]
// Renamed function and added source_type parameter
pub fn verify_and_extract_source_info(url_str: &str, source_type: i32) -> Result<SourceInfo, String> {
    match source_type {
        0 => { // GitHub
            let url = url::Url::parse(url_str).map_err(|e| format!("Invalid GitHub URL: {}", e))?;
            let host = url.host_str().unwrap_or_default();
            if host != "github.com" && host != "www.github.com" {
                return Err("URL is not from GitHub (github.com or www.github.com)".to_string());
            }

            let mut path_segments: Vec<&str> = url
                .path_segments()
                .map_or_else(Vec::new, |segments| segments.filter(|s| !s.is_empty()).collect());

            if path_segments.len() < 2 {
                return Err("GitHub URL must contain at least an owner and a repository name.".to_string());
            }

            let owner = path_segments.remove(0).to_string();
            let repo = path_segments.remove(0).to_string().trim_end_matches(".git").to_string();


            // GitHub username: alphanumeric or single hyphens, not at start/end.
            // GitHub repo: alphanumeric, ., -, _
            let owner_regex = Regex::new(r"^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$").unwrap();
            let repo_regex = Regex::new(r"^[a-zA-Z0-9_.-]+$").unwrap();
            let no_double_hyphen = Regex::new(r"--").unwrap();

            if !owner_regex.is_match(&owner) || no_double_hyphen.is_match(&owner) {
                return Err(format!("Invalid GitHub owner name: '{}'. Must be alphanumeric or single hyphens, not starting/ending with a hyphen, and no consecutive hyphens.", owner));
            }
            if !repo_regex.is_match(&repo) || repo.starts_with('-') || repo.ends_with('-') || repo.ends_with('.') || no_double_hyphen.is_match(&repo) {
                 return Err(format!("Invalid GitHub repository name: '{}'. Contains invalid characters or patterns.", repo));
            }
            Ok(SourceInfo { owner, repo, source_type })
        }
        1 => { // GitLab
            let url = url::Url::parse(url_str).map_err(|e| format!("Invalid GitLab URL: {}", e))?;
            let host = url.host_str().unwrap_or_default();
            if host != "gitlab.com" && host != "www.gitlab.com" {
                return Err("URL is not from GitLab (gitlab.com or www.gitlab.com)".to_string());
            }

            let mut path_segments: Vec<String> = url
                .path_segments()
                .map_or_else(Vec::new, |segments| segments.filter(|s| !s.is_empty()).map(String::from).collect());

            if path_segments.is_empty() {
                 return Err("GitLab URL path is empty.".to_string());
            }
            
            let repo_name_with_git = path_segments.pop().unwrap_or_default();
            let repo = repo_name_with_git.trim_end_matches(".git").to_string();

            if path_segments.is_empty() {
                return Err("GitLab URL must contain at least a group/owner and a project name.".to_string());
            }
            let owner = path_segments.join("/");

            // GitLab names: letters, digits, emojis (not handled by simple regex), '_', '.', '-', '+'.
            // Cannot start with '-' or end with '.', '.git', '.atom'.
            let gitlab_name_part_regex = Regex::new(r"^[a-zA-Z0-9](?:[a-zA-Z0-9_.-+]*[a-zA-Z0-9])?$").unwrap();
            let no_double_hyphen = Regex::new(r"--").unwrap();

            for segment in owner.split('/') {
                if !gitlab_name_part_regex.is_match(segment) || no_double_hyphen.is_match(segment) {
                     return Err(format!("Invalid GitLab group/owner segment: '{}'.", segment));
                }
            }
            if !gitlab_name_part_regex.is_match(&repo) || repo.is_empty() || repo.ends_with('.') || no_double_hyphen.is_match(&repo) {
                return Err(format!("Invalid GitLab project name: '{}'.", repo));
            }

            Ok(SourceInfo { owner, repo, source_type })
        }
        2 => { // Local File Path
            let path_obj = Path::new(url_str);

            let file_or_dir_name = path_obj.file_name()
                .and_then(|name| name.to_str())
                .map(String::from);

            let repo = match file_or_dir_name {
                Some(name) if !name.is_empty() => name,
                _ => { // If it's a root path like "/" or "C:\" or just an invalid/empty path for filename
                    if path_obj.is_absolute() && path_obj.parent().is_none() { // e.g. / or C:\
                        url_str.to_string() // Use the whole string for root
                    } else {
                        return Err(format!("Invalid local path or could not determine file/directory name: '{}'.", url_str));
                    }
                }
            };
            
            let parent_dir = path_obj.parent()
                .and_then(|p| p.to_str())
                .map(String::from)
                .unwrap_or_else(|| if path_obj.is_absolute() && path_obj.parent().is_none() { "".to_string() } else { ".".to_string() }); // Use "." for relative paths with no explicit parent

            if repo.is_empty() && !(url_str == "/" || (url_str.ends_with(":\\") && url_str.len() == 3) ) { // Check for empty repo unless it's a root
                 return Err(format!("Local path is empty or invalid: '{}'.", url_str));
            }

            Ok(SourceInfo { owner: parent_dir, repo, source_type })
        }
        _ => Err("Invalid source type specified. Use 0 for GitHub, 1 for GitLab, 2 for Local File.".to_string()),
    }
}