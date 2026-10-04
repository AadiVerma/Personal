import fs from "fs";
import path from "path";
import { DREAM_CATEGORIES, type Dream, type DreamCategory } from "./dream-types";

export { DREAM_CATEGORIES, type Dream, type DreamCategory };

export const DREAMS_FILE = path.join(process.cwd(), "content", "constellation", "dreams.json");
export const DREAMS_REPO_PATH = "content/constellation/dreams.json";

export function getDreams(): Dream[] {
  if (!fs.existsSync(DREAMS_FILE)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(DREAMS_FILE, "utf-8"));
    return Array.isArray(parsed) ? (parsed as Dream[]) : [];
  } catch {
    return [];
  }
}

/** Validates an untrusted payload; returns the cleaned list or null if malformed. */
export function sanitizeDreams(input: unknown): Dream[] | null {
  if (!Array.isArray(input)) return null;
  const out: Dream[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return null;
    const d = raw as Record<string, unknown>;
    if (typeof d.id !== "string" || typeof d.title !== "string" || !d.title.trim()) return null;
    const category = (typeof d.category === "string" && d.category in DREAM_CATEGORIES
      ? d.category
      : "legacy") as DreamCategory;
    out.push({
      id: d.id.slice(0, 120),
      title: d.title.trim().slice(0, 200),
      note: typeof d.note === "string" && d.note.trim() ? d.note.trim().slice(0, 1000) : undefined,
      emoji: typeof d.emoji === "string" && d.emoji.trim() ? d.emoji.trim().slice(0, 16) : "✨",
      category,
      targetYear: typeof d.targetYear === "string" && d.targetYear.trim() ? d.targetYear.trim().slice(0, 12) : undefined,
      manifested: !!d.manifested,
      manifestedOn: d.manifested && typeof d.manifestedOn === "string" ? d.manifestedOn.slice(0, 10) : undefined,
      createdAt: typeof d.createdAt === "string" ? d.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
  }
  return out;
}
