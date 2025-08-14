use serde_json::Value;
use std::path::PathBuf;

fn find_gitgauge_root(start_dir: PathBuf) -> Option<PathBuf> {
    let mut dir = start_dir.as_path();

    while dir.parent().is_some() {
        if dir.join(".gitgauge").exists() {
            return Some(dir.to_path_buf());
        }

        dir = dir.parent().unwrap();
    }

    None
}