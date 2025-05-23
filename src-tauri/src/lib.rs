use reqwest::{header::HeaderMap, Client, StatusCode};

use model::repo::Repo;
use response::{branch::BranchReponse, contributor::{ContributorData, ContributorResponse}};
use tauri::http::HeaderValue;
use crate::response::contributor::ContributorInfo;

mod model;
mod response;

type Result2<T> = Result<T, &'static str>;

fn construct_headers() -> HeaderMap {
    let mut headers = HeaderMap::new();

    headers.insert(
        reqwest::header::ACCEPT,
        HeaderValue::from_static("application/vnd.github+json")
    );

    headers.insert(
        "X-GitHub-Api-Version",
        HeaderValue::from_static("2022-11-28")
    );

    headers.insert(reqwest::header::USER_AGENT, HeaderValue::from_static("gitgauge"));

    return headers;
}

// Stubb for future call that will load data for in-memory model of repo
#[tauri::command]
fn load_data_from(_repo: Repo) -> Result<(), &'static str> {
    Ok(())
}

#[tauri::command]
async fn get_branch_names(repo: String, owner: String) -> Result2<Vec<String>> {
    log::info!("Starting branches....");
    let url = format!("https://api.github.com/repos/{}/{}/branches", owner, repo);
    let headers = construct_headers();
    let client = Client::new();

    let branch_request = client.get(url).headers(headers).send().await;

    let branch_response = match branch_request {
        Ok(response) => response,
        Err(e) => {
            log::error!("{}", e);
            return Err("Error sending branches request");
        },
    };

    match branch_response.status() {
        StatusCode::OK => {},
        _ => {
            log::error!("Error fetching branches");
            return Err("Error fetching branches");
        }
    };

    let branch_data = branch_response.json::<BranchReponse>().await;

    let branches = match branch_data {
        Ok(b) => b,
        Err(e) => {
            log::error!("{}", e);
            log::error!("Error parsing branches response JSON");
            return Err("Error parsing branches response JSON");
        }
    };

    log::info!("Branches: {:?}", branches);
    return Ok(branches.into());
}

#[tauri::command]
async fn get_contributor_info(repo: String, owner: String) -> Result2<Vec<ContributorInfo>> {
    log::info!("Starting Contributors");
    let url = format!("https://api.github.com/repos/{}/{}/stats/contributors", owner, repo);
    let headers = construct_headers();
    let client = Client::new();

    let contributor_analytics = client.get(url).headers(headers).send().await;
    
    let contributor_response = match contributor_analytics {
        Ok(json) => {
            if json.status() != StatusCode::OK {
                log::error!("Error fetching contributor analytics");
                return Err("Error fetching contributor analytics");
            }

            json
        },
        Err(e) => {
            log::error!("{}", e);
            return Err("Error sending contributor analytics request");
        },
    };

    let contributor_data= contributor_response.json::<ContributorResponse>().await;

    let contributors = match contributor_data {
        Ok(c) => c,
        Err(e) => {
            log::error!("{}", e);
            log::error!("Error parsing contributors response JSON");
            return Err("Error parsing contiributors response JSON");
        }
    };

    let contributors_info = contributors.into();

    log::info!("Contributors: {:?}", contributors_info);
    return Ok(contributors_info);
    // Err("error")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_branch_names,
            get_contributor_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}