use git2::Repository;
use log::info;

#[tauri::command(rename_all = "snake_case")]
pub async fn get_branch_names(path: &str) -> Result<Vec<String>, String> {
    let canonical_path = match std::path::Path::new(path).canonicalize() {
        Ok(p) => {
            println!("{}", p.to_str().unwrap());
            p
        }
        Err(e) => return Err(e.to_string()),
    };

    let repo = Repository::open(canonical_path).map_err(|e| e.to_string())?;
    let head = repo.head().map_err(|e| e.to_string())?;
    let head_name = head.shorthand();

    info!("head: {}", head_name.unwrap());

    let mut branches = repo
        .branches(None)
        .map_err(|e| e.to_string())?
        .map(|b| {
            let (branch, _) = b.map_err(|e| e.to_string()).unwrap();
            branch
                .name()
                .map_err(|e| e.to_string())
                .unwrap()
                .unwrap()
                .to_string()
        })
        .collect::<Vec<String>>();

    if let Some(head_str) = head_name {
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
