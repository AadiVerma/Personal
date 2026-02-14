import Link from "next/link";
import { ArrowLeftIcon, ScrollText } from "lucide-react";
import { getPosts } from "@/lib/blog";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { ChronicleList } from "./chronicle-list";

export const metadata = {
  title: "Chronicle",
  description: "Entries and notes from the road.",
};

export default function ChroniclePage() {
  const posts = getPosts();

  return (
    <main className="blog-index-page min-h-screen">
      <div className="relative mx-auto max-w-2xl px-4 pb-16 pt-6 md:px-6 md:pt-8">
        {/* Compact nav + title block */}
        <header className="mb-8">
          <div className="-ml-2 mb-5 flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-md border border-transparent px-3 text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground hover:shadow-sm"
              asChild
            >
              <Link href="/" className="inline-flex items-center gap-2">
                <ArrowLeftIcon className="size-4 shrink-0" />
                Back home
              </Link>
            </Button>
            <ModeToggle />
          </div>
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

        {/* Search + dense editorial list */}
        <ChronicleList posts={posts} />
      </div>
    </main>
  );
}
