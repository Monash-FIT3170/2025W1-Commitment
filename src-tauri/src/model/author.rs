use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct Author {
    pub username: String,
    pub email: String,
    pub gravitar_url: String,
    pub additions: u64,
    pub deletions: u64,
    pub changes: u64,
    pub total_commits: u64,
}