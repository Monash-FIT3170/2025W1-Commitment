import { writable } from "svelte/store";

export type GradingFile = {
  name: string;
  size: number;
  mime: string | null;
  bytes: Uint8Array;
  headers?: string[]; 
};

export const uploadedGradingFile = writable<GradingFile | null>(null);

export function clearUploadedGradingFile() {
  uploadedGradingFile.set(null);
}