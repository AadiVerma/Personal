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

/** Lightweight type for related-post suggestions (no full content). */
export type BlogPostSuggestion = Pick<BlogPost, "slug" | "title" | "excerpt" | "date" | "readTimeMinutes" | "image">;

/** Strip markdown to plain text for topic fingerprint (headers, bold, links, etc.). */
function stripMarkdownForFingerprint(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, " ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`[^`]+`/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Tokenize into words (lowercase, non-empty). */
function tokenize(text: string): string[] {
  return text.split(/\s+/).filter((w) => w.length > 1);
}

/** Build a single "topic" string from a post for similarity. */
function getTopicText(post: BlogPost): string {
  const contentSnippet = stripMarkdownForFingerprint(post.content.slice(0, 1200));
  const title = (post.title ?? "").toLowerCase();
  const excerpt = (post.excerpt ?? "").toLowerCase();
  return `${title} ${excerpt} ${contentSnippet}`;
}

/**
 * Returns suggested/related posts based on similar topics (title, excerpt, content).
 * Newly published posts are included automatically since they live in the same content pool.
 */
export function getRelatedPosts(currentSlug: string, limit = 3): BlogPostSuggestion[] {
  const posts = getPosts();
  const current = posts.find((p) => p.slug === currentSlug);
  if (!current) return [];

  const currentTokens = new Set(tokenize(getTopicText(current)));
  const others = posts.filter((p) => p.slug !== currentSlug);
  if (others.length === 0) return [];

  const scored = others.map((post) => {
    const tokens = tokenize(getTopicText(post));
    let overlap = 0;
    for (const t of tokens) {
      if (currentTokens.has(t)) overlap++;
    }
    const jaccard = currentTokens.size > 0 ? overlap / (currentTokens.size + tokens.length - overlap) : 0;
    return { post, score: jaccard };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, limit);

  return top.map(({ post }) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    date: post.date,
    readTimeMinutes: post.readTimeMinutes,
    image: post.image,
  }));
}
