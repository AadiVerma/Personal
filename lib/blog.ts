import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getReadTimeMinutes } from "./read-time";

const POSTS_DIR = path.join(process.cwd(), "content", "blog");

export { formatReadTime } from "./read-time";

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  image?: string;
  content: string;
  /** Estimated read time in minutes (word count / WPM); may be < 1 for short posts. */
  readTimeMinutes: number;
};

export function getPostSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
}

export function getPosts(): BlogPost[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => {
      const fullPath = path.join(POSTS_DIR, slug);
      const raw = fs.readFileSync(fullPath, "utf-8");
      const { data, content } = matter(raw);
      return {
        slug: slug.replace(/\.md$/, ""),
        title: (data.title as string) ?? slug,
        date: (data.date as string) ?? "",
        excerpt: (data.excerpt as string) ?? undefined,
        image: (data.image as string) || undefined,
        content,
        readTimeMinutes: getReadTimeMinutes(content),
      };
    })
    .filter((p) => p.slug);
  return posts.sort((a, b) => (b.date > a.date ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const fullPath = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const raw = fs.readFileSync(fullPath, "utf-8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: (data.title as string) ?? slug,
    date: (data.date as string) ?? "",
    excerpt: (data.excerpt as string) ?? undefined,
    image: (data.image as string) || undefined,
    content,
    readTimeMinutes: getReadTimeMinutes(content),
  };
}
