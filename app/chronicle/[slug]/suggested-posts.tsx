import Link from "next/link";
import { CalendarIcon, Clock } from "lucide-react";
import type { BlogPostSuggestion } from "@/lib/blog";
import { formatReadTime } from "@/lib/read-time";

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SuggestedPosts({ posts }: { posts: BlogPostSuggestion[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-14 border-t border-border pt-10" aria-label="Suggested reads">
      <h2 className="mb-6 text-lg font-semibold tracking-tight text-foreground">
        You might also like
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.slug} className="min-w-0">
            <Link
              href={`/chronicle/${post.slug}`}
              className="group flex h-full flex-col rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="mb-3 aspect-video w-full shrink-0 overflow-hidden rounded-md border border-border bg-muted/30">
                {post.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={post.image}
                    alt=""
                    className="h-full w-full object-cover object-center transition-transform group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/40" aria-hidden>
                    <span className="text-2xl">📜</span>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {post.excerpt}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <time dateTime={post.date} className="flex items-center gap-1">
                  <CalendarIcon className="size-3.5" />
                  {formatDate(post.date)}
                </time>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {formatReadTime(post.readTimeMinutes)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
