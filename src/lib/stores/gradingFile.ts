import { writable } from "svelte/store";

export type UploadedGradingFile = {
    name: string;
    size: number;
    mime: string;
    bytes: Uint8Array;
    headers?: string[];
    delimiter?: "," | "\t";
    valid?: boolean;
    missing?: string[]; // names of missing columns (if any)
};

export const uploaded_grading_file = writable<UploadedGradingFile | null>(null);
