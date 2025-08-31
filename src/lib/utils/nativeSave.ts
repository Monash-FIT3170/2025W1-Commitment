// src/lib/utils/nativeSave.ts


import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

/**
 * Opens a native "Save As" dialog and writes text to the chosen path.
 * Returns the saved path string, or null if the user cancelled.
 */
export async function saveTextFileNative(
    defaultFileName: string,
    text: string
): Promise<string | null> {
    const dest = await save({
        defaultPath: defaultFileName,
        filters: [
            { name: "CSV/TSV", extensions: ["csv", "tsv", "txt"] },
            { name: "All Files", extensions: ["*"] }
        ]
    });

    if (!dest) return null;

    await writeTextFile(dest, text);
    return dest;
}