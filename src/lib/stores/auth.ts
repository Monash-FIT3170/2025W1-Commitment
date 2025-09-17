import { info, error } from "@tauri-apps/plugin-log";
import { writable } from "svelte/store";

export interface AuthError {
    needs_token: boolean;
    message: string;
    repo_url?: string;
    repo_path?: string;
}

export const auth_error = writable<AuthError>({
    needs_token: false,
    message: "",
});

export function show_token_modal(
    message: string,
    repo_url?: string,
    repo_path?: string
) {
    auth_error.set({
        needs_token: true,
        message,
        repo_url,
        repo_path,
    });

    // Throw an error to stop the current execution flow
    throw new Error("AUTHENTICATION_REQUIRED: " + message);
}

export function hide_token_modal() {
    auth_error.set({
        needs_token: false,
        message: "",
    });
}

export async function retry_clone_with_token(token: string): Promise<boolean> {
    const { invoke } = await import("@tauri-apps/api/core");
    let current_error: AuthError | null = null;

    // Get current store value
    const unsubscribe = auth_error.subscribe(
        (value) => (current_error = value)
    );
    unsubscribe();

    if (!current_error || !current_error.repo_url || !current_error.repo_path) {
        error("No repository information available for retry");
        return false;
    }

    // Store the values for later use
    const repo_url = current_error.repo_url;
    const repo_path = current_error.repo_path;

    try {
        await invoke("try_clone_with_token", {
            url: repo_url,
            path: repo_path,
            token: token,
        });

        info("Repository cloned successfully with token");

        // Success - hide modal
        hide_token_modal();
        return true;
    } catch (e) {
        error("Clone with token failed:", e);
        // Update the error message but keep modal open
        auth_error.set({
            needs_token: true,
            message: String(e),
            repo_url: repo_url,
            repo_path: repo_path,
        });
        return false;
    }
}
