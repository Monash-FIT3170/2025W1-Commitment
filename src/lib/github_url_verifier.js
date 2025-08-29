/**
 * Returns the source type given a url
 *
 * @param {string} path The URL or path string to verify and parse.
 * @returns {0 | 1 | 2} source_type - 0 for GitHub, 1 for GitLab, 2 for Local File.
 * @throws {Error} If the URL/path is invalid for the given source type.
 */

export function get_source_type(path) {
    let base = path.replace("https://", "").split("/")[0];
    if (base == "github.com") return 0
    if (base == "gitlab.com") return 1
    return 2

}


/**
 * 
 * @param {string} path 
 * @returns {{ source_type: 0 | 1 | 2, source: string, owner: string, repo: string }}
 */
export function get_repo_info(path) {
    let path_split = path.split("/");
    let source_type = get_source_type(path);
    let result = {
        source_type: source_type,
        source: path_split[0],
        owner: path_split[1],
        repo: path_split[2]
    }
    return result
}