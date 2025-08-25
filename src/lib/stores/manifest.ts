import { writable } from "svelte/store";

export interface ManifestSchema {
    name: string,
    path: string,
    cloned: string,
    bookmarked: boolean,
    email_map: string | null,
    grade_sheet: string | null
}

function createManifestStore() {
    const { subscribe, set, update } = writable<ManifestSchema[]>([]);

    return {
        subscribe,
        set,
        bookmark(name: string): ManifestSchema | undefined {
            let changed: ManifestSchema | undefined;

            update((list) => {
                const next = list.map((item) => {
                    if (item.name === name) {
                        changed = {...item, bookmarked: true};
                        return changed;
                    }
                    return item;
                });
                return next;
            });
            return changed;
        },
        unbookmark(name: string): ManifestSchema | undefined {
            let changed: ManifestSchema | undefined;

            update(list => {
                const next = list.map((item) => {
                    if (item.name === name) {
                        changed = {...item, bookmarked: false};
                        return changed;
                    }
                    return item;
                });
                return next;
            });

            return changed;
        }
    };
}

export const manifest = createManifestStore();