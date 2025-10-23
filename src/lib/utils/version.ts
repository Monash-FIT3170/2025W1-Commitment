import { invoke } from "@tauri-apps/api/core";

export async function get_app_version(): Promise<string> {
    let app_version: string;
    try {
        app_version = await invoke<string>("get_app_version");
    } catch (e) {
        Error("Failed to get app version: " + e);
        app_version = "unknown";
    }
    return app_version;
}
