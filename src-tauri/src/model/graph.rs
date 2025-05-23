use chrono::NaiveDateTime;

use super::author::Author;

pub struct Graph {
    branches: Vec<Branch>,
}

pub struct Branch {
    name: String,
    commits: Vec<Commit>,
    root: Commit,
}

pub struct Commit {
    sha: String,
    message: String,
    author: Author,
    committer: Author,
    date: NaiveDateTime,
}