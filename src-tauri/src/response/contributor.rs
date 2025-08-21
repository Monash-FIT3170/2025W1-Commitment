use std::{ops::Add};

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct ContributorInfo {
    pub author: Author,
    pub total_commits: u64,
    pub additions: u64,
    pub deletions: u64,
    // pub changes: u64,
}

impl From<ContributorData> for ContributorInfo {
    fn from(contrib_data: ContributorData) -> Self {
        let lines = contrib_data.weeks.iter().fold(Week::default(), |a, w| a + *w);

        Self {
            author: contrib_data.author,
            total_commits: contrib_data.total,
            additions: lines.a,
            deletions: lines.d,
            // changes: lines.c,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct ContributorResponse(Vec<ContributorData>);

impl Into<Vec<ContributorInfo>> for ContributorResponse {
    fn into(self) -> Vec<ContributorInfo> {
        self.0.into_iter().map(|x| x.into()).collect()
    }
}

#[derive(Debug, Deserialize)]
pub struct ContributorData {
    pub author: Author,
    pub total: u64,
    pub weeks: Vec<Week>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Author {
    pub login: String,
    pub avatar_url: String,
}

#[derive(Default, Clone, Copy, Debug, Serialize, Deserialize)]
pub struct Week {
    pub w: u64,
    pub a: u64,
    pub d: u64,
    pub c: u64,
}

impl Add for Week {
    type Output = Self;

    fn add(self, rhs: Self) -> Self::Output {
        Week {
            w: 0,
            a: self.a + rhs.a,
            d: self.d + rhs.d,
            c: self.c + rhs.c,
        }
    }
}