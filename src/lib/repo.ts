export type Repo = {
    repo_path: string;
    repo_url: string;
    repo_type: string
};

export function get_repo_type(url: string) {
    const domain = new URL(url).hostname;

    if (domain.includes("github.com")) {
        return "github";
    } else if (domain.includes("gitlab.com")) {
        return "gitlab";
    } else {
        return "Unknown";
    }
}
