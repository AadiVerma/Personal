"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, CalendarIcon, Clock, ScrollText, Search, X } from "lucide-react";
import { formatReadTime } from "@/lib/read-time";

/** Shape of a post as passed from the server (matches BlogPost without content). */
type PostItem = {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  readTimeMinutes: number;
};

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function matchesSearch(post: PostItem, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const titleMatch = post.title.toLowerCase().includes(q);
  const excerptMatch = post.excerpt?.toLowerCase().includes(q) ?? false;
  return titleMatch || excerptMatch;
}

export function ChronicleList({ posts }: { posts: PostItem[] }) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredPosts = useMemo(
    () => posts.filter((post) => matchesSearch(post, search)),
    [posts, search]
  );

  // Keyboard: "/" to focus search, "Escape" to clear and blur
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSearch("");
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (posts.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center py-12 text-center">
        <div className="relative mb-6">
          <div className="flex size-24 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5">
            <ScrollText className="size-10 text-primary/50" aria-hidden />
          </div>
          <div className="absolute -bottom-1 -right-1 flex size-10 items-center justify-center rounded-full border border-border bg-background shadow-sm">
            <BookOpen className="size-5 text-muted-foreground" aria-hidden />
          </div>
        </div>
        <div className="mx-auto max-w-sm px-2">
          <h2 className="text-lg font-semibold text-foreground">
            The road is quiet
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            No tales have been inked here yet. When the first entry is written,
            it will appear in this chronicle.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section>
      {/* Search box — same box from the start; only contents change when typing */}
      <div className="mb-6">
        <label htmlFor="chronicle-search" className="sr-only">
          Wander through tales
        </label>
        <div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-background px-4 py-3 shadow-md transition-[box-shadow,border-color] focus-within:border-primary/40 focus-within:shadow-lg focus-within:shadow-primary/5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Search className="size-4 text-primary" strokeWidth={2} />
          </div>
          <input
            ref={inputRef}
            id="chronicle-search"
            type="text"
            placeholder="Wander through tales from the road…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:italic placeholder:text-muted-foreground placeholder:tracking-wide focus:outline-none"
            aria-describedby={search ? "chronicle-search-result" : undefined}
            autoComplete="off"
          />
          {search ? (
            <button
              onClick={() => setSearch("")}
              className="flex shrink-0 items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
              type="button"
            >
              <X className="size-4" strokeWidth={2.5} />
            </button>
          ) : (
            <kbd className="pointer-events-none flex shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 px-2.5 py-1.5 font-mono text-[11px] font-medium text-muted-foreground">
              /
            </kbd>
          )}
        </div>

        {search && (
          <p id="chronicle-search-result" className="mt-2 pl-1 text-xs italic text-muted-foreground">
            {filteredPosts.length === 0
              ? "No tales found along this path."
              : `${filteredPosts.length} ${filteredPosts.length === 1 ? "tale" : "tales"} discovered.`}
          </p>
        )}
      </div>

      {/* Post list */}
      {filteredPosts.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center py-16 text-center">
          <div className="relative mb-6">
            <div className="flex size-24 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5">
              <ScrollText className="size-10 text-primary/50" aria-hidden />
            </div>
            <div className="absolute -bottom-1 -right-1 flex size-10 items-center justify-center rounded-full border border-border bg-background shadow-sm">
              <BookOpen className="size-5 text-muted-foreground" aria-hidden />
            </div>
          </div>
          <div className="mx-auto max-w-sm px-2">
            <h2 className="text-lg font-semibold text-foreground">
              The path yields no tales
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              No entries match your search. Try different words or clear the search to see all tales.
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredPosts.map((post) => {
            const formattedDate = formatDate(post.date);
            return (
              <li key={post.slug}>
                <Link
                  href={`/chronicle/${post.slug}`}
                  className="group relative flex flex-col gap-0.5 overflow-hidden rounded-lg border border-border bg-card py-4 pl-5 pr-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md md:flex-row md:items-baseline md:gap-4 md:py-3 md:pl-6 md:pr-5"
                >
                  <span className="absolute inset-y-0 left-0 w-1 bg-primary/50 transition-colors group-hover:bg-primary" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-foreground transition-colors group-hover:text-primary">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="mt-1 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-0 text-xs text-muted-foreground md:mt-0">
                    <time dateTime={post.date} className="flex items-center gap-1.5">
                      <CalendarIcon className="size-3.5" />
                      {formattedDate}
                    </time>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      {formatReadTime(post.readTimeMinutes)}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
