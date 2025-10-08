import { invoke } from "@tauri-apps/api/core";
import { info, error } from "@tauri-apps/plugin-log";
import { show_token_modal } from "./stores/auth";

export type Contacts =
    | string
    | string[]
    | { Email: string }
    | { [key: string]: string };

export type Colour = Readonly<{
    r: number;
    g: number;
    b: number;
}>;

export type Contributor = Readonly<{
    username: string;
    contacts: Contacts;
    total_commits: number;
    additions: number;
    deletions: number;
    profile_colour: string;
    username_initials: string;
    ai_summary: string;
}>;

export type UserDisplayData = Readonly<{
    username: string;
    initials: string;
    profile_colour: string;
    data_to_display: number;
    offsetIndex?: number;
}>;

// Load branches for a repository
export async function load_branches(repo_path: string): Promise<string[]> {
    try {
        const real_branches = await invoke<string[]>("get_branch_names", {
            path: repo_path,
        });
        info("REAL BRANCHES " + real_branches);
        return ["All", ...real_branches];
    } catch (err) {
        error("Failed to load branches: " + err);
        return ["All"];
    }
}

type DateRange = {
    start: number;
    end: number;
};

export async function bare_clone(
    source: string,
    owner: string,
    repo: string,
    source_type: 0 | 1 | 2
): Promise<string> {
    const repo_url = `${source}/${owner}/${repo}`;

    try {
        const working_dir = await invoke<string>("get_working_directory");
        const repo_path = `${working_dir}/repositories/${source_type}-${owner}-${repo}`;
        await invoke("bare_clone", {
            url: repo_url,
            path: repo_path,
        });
        return repo_path;
    } catch (err) {
        const error_message = String(err);
        error(`Failed to clone the repository: ${error_message}`);
        let repo_path: string;

        // Check if this is an authentication error that requires a token
        if (error_message.includes("remote authentication required")) {
            const working_dir = await invoke<string>("get_working_directory");
            repo_path = `${working_dir}/repositories/${source_type}-${owner}-${repo}`;
            show_token_modal(error_message, repo_url, repo_path);
            return repo_path;
        }

        throw new Error(error_message);
    }
}

export async function load_commit_data(
    repo_path: string,
    branch?: string,
    start_date?: string,
    end_date?: string
): Promise<Contributor[]> {
    info(`Loading contributor data for ${repo_path}...`);
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
        error(`Failed to get contributor data: ${err}`);
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

// Calculate absolute value of diff for a user
export function get_user_absolute_diff(user: Contributor): number {
    return Math.abs(user.additions - user.deletions);
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

// Calculate average size of commits
export function get_average_commit_size(users: Contributor[]): number {
    if (users.length === 0) return 0;
    const size_mean: number =
        users.reduce((acc, curr) => {
            return (
                acc + get_user_total_lines_of_code(curr) / curr.total_commits
            );
        }, 0) / users.length;

    return size_mean;
}

// Calculate average absolute diff
export function get_average_absolute_diff(users: Contributor[]): number {
    if (users.length === 0) return 0;
    const abs_diff_mean: number =
        users.reduce((acc, curr) => {
            return acc + get_user_absolute_diff(curr);
        }, 0) / users.length;

    return abs_diff_mean;
}

// Calculate quartiles (Q1, Median, Q3) for a given set of numerical data
function calculate_quartiles(values: number[]): {
    q1: number;
    median: number;
    q3: number;
} {
    if (values.length === 0) return { q1: 0, median: 0, q3: 0 };

    const sorted_values = [...values].sort((a, b) => a - b);

    const find_median = (arr: number[]): number => {
        if (arr.length === 0) return 0;
        const mid_index = Math.floor(arr.length / 2);
        if (arr.length % 2 === 0) {
            return (arr[mid_index - 1] + arr[mid_index]) / 2;
        } else {
            return arr[mid_index];
        }
    };

    const median = find_median(sorted_values);
    const midPoint = Math.floor(sorted_values.length / 2);

    let lower_half: number[];
    let upper_half: number[];

    if (sorted_values.length % 2 === 0) {
        lower_half = sorted_values.slice(0, midPoint);
        upper_half = sorted_values.slice(midPoint);
    } else {
        lower_half = sorted_values.slice(0, midPoint);
        upper_half = sorted_values.slice(midPoint + 1);
    }

    const q1 = find_median(lower_half);
    const q3 = find_median(upper_half);

    return { q1, median, q3 };
}

export function get_commit_quartiles(users: Contributor[]): {
    q1: number;
    median: number;
    q3: number;
} {
    if (users.length === 0) return { q1: 0, median: 0, q3: 0 };
    const commit_values = users.map((user) => user.total_commits);
    return calculate_quartiles(commit_values);
}

export function get_commit_size_quartiles(users: Contributor[]): {
    q1: number;
    median: number;
    q3: number;
} {
    if (users.length === 0) return { q1: 0, median: 0, q3: 0 };
    const commit_size_values = users.map((user) =>
        get_user_lines_per_commit(user)
    );
    return calculate_quartiles(commit_size_values);
}

export function get_absolute_diff_quartiles(users: Contributor[]): {
    q1: number;
    median: number;
    q3: number;
} {
    if (users.length === 0) return { q1: 0, median: 0, q3: 0 };
    const absolute_diff_values = users.map((user) =>
        get_user_absolute_diff(user)
    );
    return calculate_quartiles(absolute_diff_values);
}

// Calculate standard deviation
export function get_sd(users: Contributor[], metric: string): number {
    if (users.length === 0) return 0;
    let commits: number[] = [];

    // Get the list of total commits for each user
    users.forEach((user) => {
        commits.push(user.total_commits);
    });

    // Creating the mean with Array.reduce
    const n: number = users.length;

    // Determine the mean of the given metric
    let mean: number;
    switch (metric) {
        case "commit_size": {
            mean = get_average_commit_size(users);
            break;
        }
        case "commits": {
            mean = get_average_commits(users);
            break;
        }
        case "absolute_diff": {
            mean = get_average_absolute_diff(users);
            break;
        }
        default: {
            mean = get_average_commits(users);
            break;
        }
    }

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

export function get_quartile_ref_points(
    users: Contributor[],
    metric: string
): number[] {
    if (users.length === 0) return [0, 0, 0, 0, 0];

    let quartiles: { q1: number; median: number; q3: number };
    let values: number[];

    switch (metric) {
        case "commit_size": {
            quartiles = get_commit_size_quartiles(users);
            values = users.map((user) => get_user_lines_per_commit(user));
            break;
        }
        case "commits": {
            quartiles = get_commit_quartiles(users);
            values = users.map((user) => user.total_commits);
            break;
        }
        case "absolute_diff": {
            quartiles = get_absolute_diff_quartiles(users);
            values = users.map((user) => get_user_absolute_diff(user));
            break;
        }
        default: {
            quartiles = get_commit_quartiles(users);
            values = users.map((user) => user.total_commits);
            break;
        }
    }

    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;

    return [min, quartiles.q1, quartiles.median, quartiles.q3, max];
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

export function calculate_quartile_scaling_factor(
    value: number,
    q1: number,
    q3: number
): number {
    if (value < q1) {
        return 0.9;
    } else if (value > q3) {
        return 1.1;
    } else {
        return 1.0;
    }
}

export function get_metric_min_max(
    users: Contributor[],
    metric: string
): {
    min: number;
    max: number;
} {
    if (users.length === 0) return { min: 0, max: 0 };

    let result: { min: number; max: number };
    switch (metric) {
        case "commits": {
            const minCommits: number = users.reduce(
                (min, user) => Math.min(min, user.total_commits),
                0
            );
            const maxCommits: number = users.reduce(
                (max, user) => Math.max(max, user.total_commits),
                0
            );
            result = { min: minCommits, max: maxCommits };
            break;
        }
        case "commit_size": {
            const minSize: number = users.reduce(
                (min, user) =>
                    Math.min(
                        min,
                        get_user_total_lines_of_code(user) / user.total_commits
                    ),
                0
            );
            const maxSize: number = users.reduce(
                (max, user) =>
                    Math.max(
                        max,
                        get_user_total_lines_of_code(user) / user.total_commits
                    ),
                0
            );
            result = { min: minSize, max: maxSize };
            break;
        }
        case "absolute_diff": {
            const minDiff: number = users.reduce(
                (min, user) => Math.min(min, get_user_absolute_diff(user)),
                0
            );
            const maxDiff: number = users.reduce(
                (max, user) => Math.max(max, get_user_absolute_diff(user)),
                0
            );
            result = { min: minDiff, max: maxDiff };
            break;
        }
        default: {
            const minCommits: number = users.reduce(
                (min, user) => Math.min(min, user.total_commits),
                0
            );
            const maxCommits: number = users.reduce(
                (max, user) => Math.max(max, user.total_commits),
                0
            );
            result = { min: minCommits, max: maxCommits };
            break;
        }
    }

    return result;
}

export function get_users_total_commits(
    users: Contributor[]
): UserDisplayData[] {
    if (users.length === 0) return [];
    let userTotalCommits: UserDisplayData[] = [];
    users.forEach((user) => {
        userTotalCommits.push({
            username: user.username,
            initials: user.username_initials,
            profile_colour: user.profile_colour,
            data_to_display: user.total_commits,
        });
    });
    const sortedCommits = userTotalCommits.sort(
        (a, b) => a.data_to_display - b.data_to_display
    );
    const groups = new Map<number, any[]>();
    sortedCommits.forEach((user) => {
        if (!groups.has(user.data_to_display)) {
            groups.set(user.data_to_display, []);
        }
        groups.get(user.data_to_display)!.push(user);
    });
    const result: any[] = [];
    groups.forEach((users, _) => {
        if (users.length === 1) {
            result.push(users[0]);
        } else {
            users.forEach((user, index) => {
                result.push({
                    ...user,
                    offsetIndex: index - (users.length - 1) / 2,
                });
            });
        }
    });
    return result;
}

export function get_users_avg_commit_size(
    users: Contributor[]
): UserDisplayData[] {
    if (users.length === 0) return [];
    let userAvgCommitSize: UserDisplayData[] = [];
    users.forEach((user) => {
        userAvgCommitSize.push({
            username: user.username,
            initials: user.username_initials,
            profile_colour: user.profile_colour,
            data_to_display: Number(
                (
                    get_user_total_lines_of_code(user) / user.total_commits
                ).toFixed(2)
            ),
        });
    });

    const sortedCommits = userAvgCommitSize.sort(
        (a, b) => a.data_to_display - b.data_to_display
    );
    const groups = new Map<number, any[]>();
    sortedCommits.forEach((user) => {
        if (!groups.has(user.data_to_display)) {
            groups.set(user.data_to_display, []);
        }
        groups.get(user.data_to_display)!.push(user);
    });
    const result: UserDisplayData[] = [];

    groups.forEach((users, _) => {
        if (users.length === 1) {
            result.push(users[0]);
        } else {
            users.forEach((user, index) => {
                result.push({
                    ...user,
                    offsetIndex: index - (users.length - 1) / 2,
                });
            });
        }
    });
    return result;
}

// Get users absolute diff data
export function get_users_absolute_diff(
    users: Contributor[]
): UserDisplayData[] {
    if (users.length === 0) return [];
    let userAbsoluteDiff: UserDisplayData[] = [];
    users.forEach((user) => {
        userAbsoluteDiff.push({
            username: user.username,
            initials: user.username_initials,
            profile_colour: user.profile_colour,
            data_to_display: get_user_absolute_diff(user),
        });
    });

    const sortedDiffs = userAbsoluteDiff.sort(
        (a, b) => a.data_to_display - b.data_to_display
    );
    const groups = new Map<number, any[]>();
    sortedDiffs.forEach((user) => {
        if (!groups.has(user.data_to_display)) {
            groups.set(user.data_to_display, []);
        }
        groups.get(user.data_to_display)!.push(user);
    });
    const result: UserDisplayData[] = [];

    groups.forEach((users, _) => {
        if (users.length === 1) {
            result.push(users[0]);
        } else {
            users.forEach((user, index) => {
                result.push({
                    ...user,
                    offsetIndex: index - (users.length - 1) / 2,
                });
            });
        }
    });
    return result;
}
