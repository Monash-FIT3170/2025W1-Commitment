use git2::Repository;
use log::info;

use crate::utils::to_string;

#[tauri::command(rename_all = "snake_case")]
pub async fn get_branch_names(path: &str) -> Result<Vec<String>, String> {
    let canonical_path = match std::path::Path::new(path).canonicalize() {
        Ok(p) => {
            println!("{}", p.to_str().unwrap());
            p
        }
        Err(e) => return Err(e.to_string()),
    };

    let repo = Repository::open(canonical_path).map_err(to_string)?;
    let head = repo.head().map_err(to_string)?;
    let head_str = head.shorthand().unwrap_or("");
    let origin_head = format!("origin/{head_str}");

    info!("head: {head_str}");
    info!("origin head: {origin_head}");

    let mut branches = repo
        .branches(None)
        .map_err(to_string)?
        .map(|b| {
            let (branch, _) = b.map_err(to_string).unwrap();
            branch
                .name()
                .map_err(to_string)
                .unwrap()
                .unwrap()
                .to_string()
        })
        .filter(|b| b.ne("origin/HEAD") && b.ne(origin_head.as_str())) // TODO: Should only removed
        // copy of branch pointed to by HEAD for bare-clones
        .collect::<Vec<String>>();

    // Move HEAD name to start of list
    if !head_str.is_empty() {
        branches
            .iter()
            .position(|b| b.eq(head_str))
            .iter()
            .for_each(|head_idx| {
                branches.remove(*head_idx);
                branches.insert(0, head_str.to_string());
            });
    }

    Ok(branches)
}
