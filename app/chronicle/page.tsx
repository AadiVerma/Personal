import Link from "next/link";
import { ArrowLeftIcon, BookOpen, CalendarIcon, Clock, ScrollText } from "lucide-react";
import { getPosts, formatReadTime } from "@/lib/blog";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Chronicle",
  description: "Entries and notes from the road.",
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

export default function ChroniclePage() {
  const posts = getPosts();

  return (
    <main className="blog-index-page min-h-screen">
      <div className="relative mx-auto max-w-2xl px-4 pb-16 pt-6 md:px-6 md:pt-8">
        {/* Compact nav + title block */}
        <header className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-5 rounded-md border border-transparent px-3 text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground hover:shadow-sm"
            asChild
          >
            <Link href="/" className="inline-flex items-center gap-2">
              <ArrowLeftIcon className="size-4 shrink-0" />
              Back home
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Chronicle
          </h1>
          <div className="mt-3 flex items-center gap-3 border-l-2 border-primary/50 pl-4">
            <ScrollText className="size-4 shrink-0 text-primary/60" aria-hidden />
            <p className="text-base italic leading-relaxed tracking-wide text-muted-foreground">
              <span className="text-foreground/85">Entries and notes from the road.</span>
            </p>
          </div>
        </header>

        {/* Dense editorial list – left accent, minimal gap */}
        <section>
          {posts.length === 0 ? (
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
          ) : (
            <ul className="space-y-3">
              {posts.map((post) => {
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
      </div>
    </main>
  );
}
