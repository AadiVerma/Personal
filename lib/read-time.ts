/** Average adult reading speed (words per minute). Used for read time. */
const WPM = 200;

/** Count words in plain text or markdown: strip code blocks, keep link text, then split on whitespace. */
function wordCount(text: string): number {
  let stripped = text
    .replace(/```[\s\S]*?```/g, " ") // remove fenced code blocks
    .replace(/`[^`]*`/g, " ") // remove inline code
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1"); // keep link text, drop URL
  stripped = stripped.replace(/[#*_~]/g, " ").trim();
  const words = stripped.split(/\s+/).filter(Boolean);
  return words.length;
}

/** Estimated read time in minutes. Uses 200 WPM (average adult). No minimum—short posts can be < 1. */
export function getReadTimeMinutes(content: string): number {
  const words = wordCount(content);
  return words / WPM;
}

/** Human-readable read time, in a poetic tone for the chronicle. */
export function formatReadTime(minutes: number): string {
  if (minutes < 1) return "A moment's read";
  const n = Math.ceil(minutes);
  return n === 1 ? "A minute on the path" : `${n} min on the path`;
}
