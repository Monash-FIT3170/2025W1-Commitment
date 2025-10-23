import { info } from "@tauri-apps/plugin-log";

const min_loading_time = 1000;

export function loading_sleep(start_time: number) {
    const ms = Date.now() - start_time;
    info(`time taken: ${ms}ms`);
    info(`sleeping for: ${Math.max(0, min_loading_time - ms)}ms`);
    return new Promise((resolve) =>
        setTimeout(resolve, Math.max(0, min_loading_time - ms))
    );
}
