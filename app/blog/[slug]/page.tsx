import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarIcon, ArrowLeftIcon } from "lucide-react";
import { getPostBySlug, getPostSlugs } from "@/lib/blog";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { RESUME_DATA } from "@/data/resume-data";
import { Button } from "@/components/ui/button";
import { DeletePostButton } from "./delete-post-button";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ key?: string }> };

export async function generateStaticParams() {
  const slugs = getPostSlugs();
  return slugs.map((slug) => ({ slug: slug.replace(/\.md$/, "") }));
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { key } = await searchParams;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const formattedDate = formatDate(post.date);
  const isAdmin = process.env.BLOG_SECRET && key === process.env.BLOG_SECRET;

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="container relative mx-auto max-w-[680px] scroll-my-12 px-4 pb-20 pt-8 md:px-6 md:pt-12">
        {/* Back link */}
        <div className="mb-8 md:mb-10">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 rounded-md border border-transparent px-3 text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground hover:shadow-sm"
            asChild
          >
            <Link href="/blog" className="inline-flex items-center gap-2">
              <ArrowLeftIcon className="size-4 shrink-0" />
              Back to Chronicles
            </Link>
          </Button>
        </div>

        <article className="blog-article">
          {/* Accent line */}
          <div className="mb-6 h-1 w-12 rounded-full bg-primary/80 md:mb-8" aria-hidden />

          <header className="mb-10 md:mb-14">
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <time dateTime={post.date} className="flex items-center gap-2 font-medium">
                <CalendarIcon className="size-4" />
                {formattedDate}
              </time>
              <span className="text-muted-foreground/60" aria-hidden>
                ·
              </span>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-foreground">
                {RESUME_DATA.name}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl md:leading-[1.15]">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
            )}
          </header>

          <div className="blog-body">
            <MarkdownContent content={post.content} />
          </div>
        </article>

        {/* Footer CTA */}
        <footer className="mt-14 border-t border-border pt-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href="/blog">
                <ArrowLeftIcon className="size-4" />
                Back to Chronicles
              </Link>
            </Button>
            {isAdmin && (
              <div className="flex items-center gap-3">
                <DeletePostButton slug={slug} />
              </div>
            )}
          </div>
        </footer>
      </div>
    </main>
  );
}
