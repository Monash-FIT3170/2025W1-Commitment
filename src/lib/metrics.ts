import { invoke } from "@tauri-apps/api/core";
import { info } from "@tauri-apps/plugin-log";
import { show_token_modal } from "./stores/auth";

export type Contacts =
    | string
    | string[]
    | { Email: string }
    | { [key: string]: string };

export type Contributor = Readonly<{
    username: string;
    contacts: Contacts;
    total_commits: number;
    additions: number;
    deletions: number;
    bitmap_hash: String; // tmp use to store gravatar login
    bitmap: String; // tmp use to store gravatar url
    ai_summary: String;
}>;

// Load branches for a repository
export async function load_branches(repo: string): Promise<string[]> {
    const repo_path = `../.gitgauge/repositories/${repo}`;
    console.log("PATH", repo_path);
    try {
        const real_branches = await invoke<string[]>("get_branch_names", {
            path: repo_path,
        });
        console.log("REAL BRANCHES", real_branches);
        return ["All", ...real_branches];
    } catch (err) {
        console.error("Failed to load branches: ", err);
        return ["All"];
    }
}

type DateRange = {
    start: number;
    end: number;
};

export async function load_commit_data(
    source: string,
    owner: string,
    repo: string,
    source_type: 0 | 1 | 2,
    branch?: string,
    start_date?: string,
    end_date?: string
): Promise<Contributor[]> {
    info(`Loading contributor data for ${owner}/${repo}...`);
    const repo_url = `${source}/${owner}/${repo}`;

    const repo_path = `../.gitgauge/repositories/${owner}-${repo}`;
    try {
        await invoke("bare_clone", {
            url: repo_url,
            path: repo_path,
        });
        info(`Repository is cloned or already exists at ${repo_path}`);
    } catch (err) {
        const error_message = String(err);
        info(`Failed to clone the repository: ${error_message}`);

        // Check if this is an authentication error that requires a token
        if (error_message.includes("private and requires authentication")) {
            show_token_modal(error_message, repo_url, repo_path);
        }

        return [];
    }

    try {
        let date_range: DateRange | undefined = undefined;

        if (start_date && end_date) {
            const start_ts = Math.floor(
                parse_date(start_date).getTime() / 1000
            );
            const end_ts = Math.floor(parse_date(end_date).getTime() / 1000);
            date_range = { start: start_ts, end: end_ts }; // Send as object
        }

        const commit_data = await invoke<Contributor[]>(
            "get_contributor_info",
            { path: repo_path, branch: branch, date_range: date_range }
        );
        const commit_array = Object.values(commit_data);
        return commit_array;
    } catch (err) {
        info(`Failed to get contributor data: ${err}`);
        return [];
    }
}

function parse_date(dateStr: string): Date {
    //date is "DD-MM-YY", convert to "YYYY-MM-DD"
    const [day, month, year] = dateStr.split("-");
    // Assume year is "25" for 2025
    const full_year = year.length === 2 ? "20" + year : year;
    return new Date(`${full_year}-${month}-${day}`);
}

// 1. Total Commits for a user
export function get_user_total_commits(user: Contributor): number {
    return user.total_commits;
}

// 2. Total Lines of Code (additions + deletions) for a user
export function get_user_total_lines_of_code(user: Contributor): number {
    return user.additions + user.deletions;
}

// 3. Lines per Commit for a user
export function get_user_lines_per_commit(user: Contributor): number {
    const total_commits = get_user_total_commits(user);
    const total_lines = get_user_total_lines_of_code(user);
    return total_commits === 0 ? 0 : Math.round(total_lines / total_commits);
}

// 4. Commits per Day for a user
// export function getUserCommitsPerDay(user: User): number {
//     const allDates = user.commits.map(commit => commit.date);
//     const uniqueDates = new Set(allDates);
//     const totalCommits = getUserTotalCommits(user);
//     return uniqueDates.size === 0 ? 0 : +(totalCommits / uniqueDates.size).toFixed(2);
// }

// 5. Total Additions for a user
export function get_user_total_additions(user: Contributor): number {
    return user.additions;
}

// 6. Total Deletions for a user
export function get_user_total_deletions(user: Contributor): number {
    return user.deletions;
}

// Calculate average commits
export function get_average_commits(users: Contributor[]): number {
    if (users.length === 0) return 0;
    const commit_mean: number =
        users.reduce((acc, curr) => {
            return acc + curr.total_commits;
        }, 0) / users.length;

    return commit_mean;
}

// Calculate standard deviation
export function get_sd(users: Contributor[]): number {
    if (users.length === 0) return 0;
    let commits: number[] = [];

    // Get the list of total commits for each user
    users.forEach((user) => {
        commits.push(user.total_commits);
    });

    // Creating the mean with Array.reduce
    const n: number = users.length;
    const mean = get_average_commits(users);

    const variance: number =
        commits.reduce(
            (acc: number, val: number) => acc + Math.pow(val - mean, 2),
            0
        ) / n;

    return Math.sqrt(variance);
}

// Calculate reference points
export function get_ref_points(mean: number, sd: number): number[] {
    if (sd === 0) return [mean, mean, mean, mean, mean];
    return [mean - 2 * sd, mean - sd, mean, mean + sd, mean + 2 * sd];
}

// Calculate scaling factor
export function calculate_scaling_factor(
    num_commits: number,
    mean: number,
    sd: number
): number {
    if (sd === 0) return 1.0;
    const z_score = (num_commits - mean) / sd;
    const EPSILON = 1e-6;
    if (Math.abs(z_score) < EPSILON) {
        return 1.0;
    } else if (Math.abs(z_score) <= 1) {
        return 1.0;
    } else if (z_score < -1 && z_score >= -2) {
        return 0.9;
    } else if (z_score > 1 && z_score <= 2) {
        return 1.1;
    } else {
        return z_score < 0 ? 0.8 : 1.2;
    }
}
