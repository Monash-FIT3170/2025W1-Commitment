// src/lib/dnd-guards.ts
export function installGlobalDnDGuards() {
    const prevent = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Block the WebView default behavior (opening files / navigation)
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);

    // optional: also block on the document body for safety
    document.addEventListener("dragover", prevent);
    document.addEventListener("drop", prevent);

    return () => {
        window.removeEventListener("dragover", prevent);
        window.removeEventListener("drop", prevent);
        document.removeEventListener("dragover", prevent);
        document.removeEventListener("drop", prevent);
    };
}
