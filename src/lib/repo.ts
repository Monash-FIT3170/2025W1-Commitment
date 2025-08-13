export type Repo = {
    repo_name: string;
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

export function get_repo_name(url: string) {
    let result = new URL(url).pathname.split("/").at(-1);
    if (result) {
        return result;
    } else {
        return "Unknown";
    }
}
