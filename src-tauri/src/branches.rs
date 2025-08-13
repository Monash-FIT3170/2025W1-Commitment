use git2::Repository;

#[tauri::command]
pub async fn get_branch_names(path: &str) -> Result<Vec<String>, String> {
    let canonical_path = match std::path::Path::new(path).canonicalize() {
        Ok(p) => {
            println!("{}", p.to_str().unwrap());
            p
        },
        Err(e) => return Err(e.to_string()),
    };

    let repo = Repository::open(canonical_path).map_err(|e| e.to_string())?;

    let branches = repo
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

    Ok(branches)
}
