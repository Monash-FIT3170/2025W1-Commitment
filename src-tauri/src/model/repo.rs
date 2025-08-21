pub struct RemoteRepo {
    name: String,
    owner: String,
}

pub enum Repo {
    GITHUB(RemoteRepo),
    GITLAB(RemoteRepo),
    LOCAL(String),
}