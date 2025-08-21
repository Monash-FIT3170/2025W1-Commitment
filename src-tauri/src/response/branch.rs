use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct BranchReponse(Vec<BranchData>);

impl Into<Vec<String>> for BranchReponse {

    fn into(self) -> Vec<String> {
        self.0.iter().map(|x| x.name.clone()).collect()
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct BranchData {
  pub name: String,
}
