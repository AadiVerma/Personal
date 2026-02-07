import { notFound } from "next/navigation";
import Link from "next/link";
import { BlogEditor } from "@/app/blog/admin/blog-editor";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, InfoIcon, BookMarkedIcon } from "lucide-react";
import { getPostBySlug } from "@/lib/blog";

type Props = { searchParams: Promise<{ key?: string; slug?: string }> };

export const metadata = {
  title: "Chronicles · Admin",
  robots: "noindex, nofollow",
};

export default async function BlogAdminPage({ searchParams }: Props) {
  const { key, slug: slugParam } = await searchParams;
  const secret = process.env.BLOG_SECRET;

  if (!secret || key !== secret) {
    notFound();
  }

  const existingPost = slugParam?.trim() ? getPostBySlug(slugParam.trim()) : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-8 md:px-6 md:pt-10">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-8 rounded-md border border-transparent px-3 text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground hover:shadow-sm"
          asChild
        >
          <Link href="/blog" className="inline-flex items-center gap-2">
            <ArrowLeftIcon className="size-4 shrink-0" />
            Back to Chronicles
          </Link>
        </Button>

        <header className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <BookMarkedIcon className="size-4 text-primary" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Admin</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {existingPost ? "Edit entry" : "New entry"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Write in Markdown. Save writes to <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">content/blog/</code> (locally or via GitHub when deployed).
          </p>
        </header>

        <details className="group mb-8 rounded-xl border border-border/60 bg-muted/20">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
            <InfoIcon className="size-4 shrink-0 text-primary/70" />
            <span className="font-medium">How to save & add images</span>
          </summary>
          <div className="border-t border-border/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            <p className="mb-2"><strong>Save & images:</strong> Locally they write to disk. When deployed, set <code className="rounded bg-muted px-1 font-mono">GITHUB_TOKEN</code> and <code className="rounded bg-muted px-1 font-mono">GITHUB_REPO</code> so both the post and uploaded images are committed to your repo. Use &quot;Upload image&quot; in Body to add images to <code className="rounded bg-muted px-1 font-mono">public/blog/</code>. External image URLs still work.</p>
          </div>
        </details>

        <BlogEditor
          initialData={
            existingPost
              ? {
                  slug: existingPost.slug,
                  title: existingPost.title,
                  date: existingPost.date,
                  excerpt: existingPost.excerpt ?? "",
                  image: existingPost.image ?? "",
                  content: existingPost.content,
                }
              : undefined
          }
        />
      </div>
    </main>
  );
}
