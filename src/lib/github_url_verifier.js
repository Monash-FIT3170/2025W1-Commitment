/**
 * Verifies a URL or path and extracts owner/repo or parent/name information based on the source type.
 *
 * @param {string} url_string The URL or path string to verify and parse.
 * @param {0 | 1 | 2} source_type - 0 for GitHub, 1 for GitLab, 2 for Local File.
 * @returns {{owner: string, repo: string}} An object containing the owner/group/parent and repo/project/name.
 * @throws {Error} If the URL/path is invalid for the given source type.
 */
export function verify_and_extract_source_info(url_string, source_type) {
    if (typeof url_string !== 'string' || url_string.trim() === '') {
        throw new Error('Input string cannot be empty.');
    }

    switch (source_type) {
        case 0: // GitHub
            try {
                const url = new URL(url_string);
                const host = url.hostname;
                if (host !== 'github.com' && host !== 'www.github.com') {
                    throw new Error('URL is not from GitHub (github.com or www.github.com)');
                }

                const path_segments = url.pathname.split('/').filter(segment => segment.length > 0);
                if (path_segments.length < 2) {
                    throw new Error('GitHub URL must contain at least an owner and a repository name.');
                }

                const owner = path_segments[0];
                let repo = path_segments[1];
                if (repo.endsWith('.git')) {
                    repo = repo.slice(0, -4);
                }

                const owner_regex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
                const repo_regex = /^[a-zA-Z0-9_.-]+$/; // GitHub repos can have dots
                const no_double_hyphen = /--/;

                if (!owner_regex.test(owner) || no_double_hyphen.test(owner)) {
                    throw new Error(`Invalid GitHub owner name: "${owner}". Must be alphanumeric or single hyphens, not starting/ending with a hyphen, and no consecutive hyphens.`);
                }
                if (!repo_regex.test(repo) || repo.startsWith('-') || repo.endsWith('-') || repo.endsWith('.') || no_double_hyphen.test(repo)) {
                    throw new Error(`Invalid GitHub repository name: "${repo}". Contains invalid characters or patterns.`);
                }
                return { owner, repo };
            } catch (e) {
                if (e instanceof TypeError && e.message.includes('Invalid URL')) { // Catch URL constructor errors
                    throw new Error(`Invalid GitHub URL format: ${url_string}`);
                }
                throw e; // Re-throw other errors (like custom ones)
            }

        case 1: // GitLab
            try {
                const url = new URL(url_string);
                const host = url.hostname;
                if (host !== 'gitlab.com' && host !== 'www.gitlab.com') {
                    throw new Error('URL is not from GitLab (gitlab.com or www.gitlab.com)');
                }

                const path_segments = url.pathname.split('/').filter(segment => segment.length > 0);

                if (path_segments.length === 0) {
                    throw new Error('GitLab URL path is empty.');
                }

                let repo_with_git = path_segments.pop();
                if (typeof repo_with_git === 'undefined') { // Should not happen if length > 0 check passed, but defensive
                    throw new Error('Could not determine GitLab project name.');
                }
                let repo = repo_with_git.endsWith('.git') ? repo_with_git.slice(0, -4) : repo_with_git;

                if (path_segments.length === 0) {
                    throw new Error('GitLab URL must contain at least a group/owner and a project name.');
                }
                const owner = path_segments.join('/');

                // GitLab names: letters, digits, '_', '.', '-', '+'. No leading/trailing hyphens.
                const gitlab_name_part_regex = /^[a-zA-Z0-9](?:[a-zA-Z0-9_.\-+]*[a-zA-Z0-9])?$/; // Corrected regex
                const noDoubleHyphen = /--/;

                owner.split('/').forEach(segment => {
                    if (!gitlab_name_part_regex.test(segment) || noDoubleHyphen.test(segment)) {
                        throw new Error(`Invalid GitLab group/owner segment: "${segment}".`);
                    }
                });
                if (!gitlab_name_part_regex.test(repo) || repo.length === 0 || repo.endsWith('.') || noDoubleHyphen.test(repo)) {
                    throw new Error(`Invalid GitLab project name: "${repo}".`);
                }
                return { owner, repo };
            } catch (e) {
                if (e instanceof TypeError && e.message.includes('Invalid URL')) {
                    throw new Error(`Invalid GitLab URL format: ${url_string}`);
                }
                throw e;
            }

        case 2: // Local File
            // Basic validation for local paths: just ensure it's not obviously empty or just whitespace.
            // More complex validation (e.g., existence) is out of scope for this client-side function.
            // For local paths, we'll treat the last segment as 'repo' and the preceding path as 'owner'.
            const normalized_path = url_string.replace(/\\\\/g, '/'); // Normalize backslashes to forward slashes
            const segments = normalized_path.split('/').filter(s => s.length > 0);

            if (segments.length === 0) {
                // Handle root paths like "/" or "C:/"
                if (normalized_path === '/' || /^[a-zA-Z]:\/$/.test(normalized_path)) {
                    return { owner: '', repo: normalized_path };
                }
                throw new Error('Local path is empty or invalid.');
            }

            const repo = segments.pop();
            const owner = segments.join('/');

            if (!repo) { // Should not happen if segments.length > 0 initially
                throw new Error('Could not determine file/directory name from local path.');
            }

            return { owner: owner || '.', repo }; // Use '.' for owner if no parent path after splitting

        default:
            throw new Error('Invalid source type specified. Use 0 for GitHub, 1 for GitLab, 2 for Local File.');
    }
}

