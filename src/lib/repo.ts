export type Repo = {
  repoPath: string;
  repoUrl: string;
  repoType: string
};


export function getRepoType(url: string) {
  const domain = new URL(url).hostname;

  if (domain.includes("github.com")) {
    return "github";
  } else if (domain.includes("gitlab.com")) {
    return "gitlab";
  } else {
    return "Unknown";
  }
}