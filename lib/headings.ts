export type Heading = {
  id: string;
  text: string;
  level: number;
};

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function extractHeadings(content: string): Heading[] {
  const lines = content.split(/\r?\n/);
  const headings: Heading[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,2})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length;
    const rawText = match[2].trim();
    const text = rawText
      .replace(/\*\*/g, "")
      .replace(/__/g, "")
      .replace(/`/g, "");

    headings.push({
      id: slugifyHeading(text),
      text,
      level,
    });
  }

  // Deduplicate ids
  const seen = new Map<string, number>();
  for (const h of headings) {
    const count = seen.get(h.id) ?? 0;
    seen.set(h.id, count + 1);
    if (count > 0) {
      h.id = `${h.id}-${count}`;
    }
  }

  return headings;
}
