"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, CopyIcon, DownloadIcon, ExternalLinkIcon, EyeIcon, FileTextIcon, ImagePlusIcon, PenLineIcon, SaveIcon } from "lucide-react";
import matter from "gray-matter";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { getReadTimeMinutes, formatReadTime } from "@/lib/read-time";
import { RESUME_DATA } from "@/data/resume-data";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type InitialData = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  content: string;
};

const frontmatterLines = (
  title: string,
  excerpt: string,
  date: string,
  image: string
) => {
  const lines = [
    `title: "${title.replace(/"/g, '\\"')}"`,
    `date: "${date.replace(/"/g, '\\"')}"`,
    `excerpt: "${excerpt.replace(/"/g, '\\"')}"`,
  ];
  if (image.trim()) {
    const escaped = image.trim()
      .replace(/\r?\n/g, " ")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
    lines.push(`image: "${escaped}"`);
  }
  return `---\n${lines.join("\n")}\n---\n\n`;
};

const DEFAULT_TITLE = "A leaf yet unturned";
const DEFAULT_EXCERPT = "A few lines from the road—enough to beckon the reader.";
const DEFAULT_IMAGE = "https://imgs.search.brave.com/RYc2IhlckWspRSSBk5LLKxAIgHYz2plLGN9fWdlVsy8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2QyL2Rh/LzkyL2QyZGE5MmIy/ZGY4YjUwNmVlMmQx/YzRmNWMyY2VhM2My/LmpwZw";
const DEFAULT_BODY = `The road is strewn with leaves, each one a moment passed.
Set down what you have gathered—and what still \`lies\` <mark>ahead</mark>.`;

const inputClassName =
  "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

function formatPreviewDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** When body contains frontmatter, parse it and return { title, date, excerpt, image, body } for preview. */
function getPreviewFromValue(
  value: string,
  form: { title: string; date: string; excerpt: string; image: string }
) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("---")) {
    return { title: form.title, date: form.date, excerpt: form.excerpt, image: form.image, body: value };
  }
  try {
    const parsed = matter(value);
    const d = parsed.data as Record<string, unknown>;
    return {
      title: (d.title as string) ?? form.title,
      date: (d.date as string) ?? form.date,
      excerpt: (d.excerpt as string) ?? form.excerpt,
      image: (d.image as string) ?? form.image,
      body: parsed.content,
    };
  } catch {
    return { title: form.title, date: form.date, excerpt: form.excerpt, image: form.image, body: value };
  }
}

export function BlogEditor({ initialData }: { initialData?: InitialData }) {
  const { resolvedTheme } = useTheme();
  const [value, setValue] = useState(initialData?.content ?? DEFAULT_BODY);
  const [title, setTitle] = useState(initialData?.title ?? DEFAULT_TITLE);
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? DEFAULT_EXCERPT);
  const [date, setDate] = useState(initialData?.date ?? new Date().toISOString().slice(0, 10));
  const [image, setImage] = useState(initialData?.image ?? DEFAULT_IMAGE);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMessage, setImageMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverMessage, setCoverMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const colorMode = resolvedTheme === "dark" ? "dark" : "light";

  const slugFromTitle =
    title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") || "untitled";
  const suggestedFilename = initialData
    ? `${initialData.slug}.md`
    : `${slugFromTitle || "post"}.md`;

  const fullMarkdown = title
    ? frontmatterLines(title, excerpt, date, image) + value
    : value;

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(fullMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fullMarkdown]);

  const download = useCallback(() => {
    const blob = new Blob([fullMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = suggestedFilename;
    a.click();
    URL.revokeObjectURL(url);
  }, [fullMarkdown, suggestedFilename]);

  const saveToRepo = useCallback(async () => {
    const key = searchParams.get("key");
    if (!key) {
      setSaveMessage({ type: "err", text: "Missing key. Open admin with ?key=YOUR_SECRET" });
      return;
    }
    if (!title?.trim()) {
      setSaveMessage({ type: "err", text: "Enter a title first" });
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/chronicle/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, filename: suggestedFilename, content: fullMarkdown }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveMessage({ type: "err", text: data.error || "Save failed. Use Download when on Prod." });
        return;
      }
      setSaveMessage({ type: "ok", text: `Saved to content/blog/${suggestedFilename}` });
      setTimeout(() => setSaveMessage(null), 4000);
    } catch {
      setSaveMessage({ type: "err", text: "Network error. Use Download instead." });
    } finally {
      setSaving(false);
    }
  }, [title, suggestedFilename, fullMarkdown, searchParams]);

  const uploadImage = useCallback(
    async (file: File) => {
      const key = searchParams.get("key");
      if (!key) {
        setImageMessage({ type: "err", text: "Missing key. Open admin with ?key=YOUR_SECRET" });
        return;
      }
      setUploadingImage(true);
      setImageMessage(null);
      try {
        const form = new FormData();
        form.set("key", key);
        form.set("file", file);
        const res = await fetch("/api/chronicle/upload-image", { method: "POST", body: form });
        const text = await res.text();
        let data: { error?: string; path?: string } = {};
        try {
          data = JSON.parse(text);
        } catch {
          setImageMessage({ type: "err", text: res.ok ? "Upload failed" : `Upload failed (${res.status})` });
          return;
        }
        if (!res.ok) {
          setImageMessage({ type: "err", text: data.error || `Upload failed (${res.status})` });
          return;
        }
        const rawPath = data.path as string;
        const imagePath = rawPath.startsWith("public/") ? rawPath.replace(/^public/, "") : rawPath;
        const alt = file.name.replace(/\.[^.]+$/, "");
        const markdown = `\n![${alt}](${imagePath})\n`;
        setValue((v) => v + markdown);
        setImageMessage({ type: "ok", text: `Added ${imagePath} to post` });
        setImage((prev) => prev || imagePath);
        setTimeout(() => setImageMessage(null), 3000);
      } catch {
        setImageMessage({ type: "err", text: "Network error" });
      } finally {
        setUploadingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [searchParams]
  );

  const uploadCoverImage = useCallback(
    async (file: File) => {
      const key = searchParams.get("key");
      if (!key) {
        setCoverMessage({ type: "err", text: "Missing key. Open admin with ?key=YOUR_SECRET" });
        return;
      }
      setUploadingCover(true);
      setCoverMessage(null);
      try {
        const form = new FormData();
        form.set("key", key);
        form.set("file", file);
        const res = await fetch("/api/chronicle/upload-image", { method: "POST", body: form });
        const text = await res.text();
        let data: { error?: string; path?: string } = {};
        try {
          data = JSON.parse(text);
        } catch {
          setCoverMessage({ type: "err", text: res.ok ? "Upload failed" : "Upload failed" });
          return;
        }
        if (!res.ok) {
          setCoverMessage({ type: "err", text: (data.error as string) || "Upload failed" });
          return;
        }
        const rawPath = data.path as string;
        const imagePath = rawPath.startsWith("public/") ? rawPath.replace(/^public/, "") : rawPath;
        setImage(imagePath);
        setCoverMessage({ type: "ok", text: `Cover set to ${imagePath}` });
        setTimeout(() => setCoverMessage(null), 3000);
      } catch {
        setCoverMessage({ type: "err", text: "Network error" });
      } finally {
        setUploadingCover(false);
        if (coverFileInputRef.current) coverFileInputRef.current.value = "";
      }
    },
    [searchParams]
  );

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-7">
        <div className="mb-5 flex items-center gap-2">
          <FileTextIcon className="size-4 text-primary/80" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Post details
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My first post"
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="excerpt" className="mb-2 block text-sm font-medium text-muted-foreground">
              Excerpt <span className="font-normal">(optional)</span>
            </label>
            <input
              id="excerpt"
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary for the list"
              className={inputClassName}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="date" className="mb-2 block text-sm font-medium text-muted-foreground">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClassName}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="image" className="mb-2 block text-sm font-medium text-muted-foreground">
              Cover image <span className="font-normal">(optional)</span>
            </label>
            <div className="flex min-w-0 gap-2">
              <input
                id="image"
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="Paste a link (e.g. /blog/hero.jpg or https://...) or upload"
                className={`${inputClassName} min-w-0`}
              />
              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadCoverImage(f);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingCover}
                className="shrink-0 gap-2"
                onClick={() => coverFileInputRef.current?.click()}
              >
                <ImagePlusIcon className="size-4" />
                {uploadingCover ? "Uploading…" : "Upload"}
              </Button>
            </div>
            {coverMessage && (
              <p className={`mt-1.5 text-xs ${coverMessage.type === "ok" ? "text-primary" : "text-destructive"}`}>
                {coverMessage.text}
              </p>
            )}
            <p className="mt-1.5 text-xs text-muted-foreground">
              Shown at the top of the post. Paste a URL/path or upload an image; it will be saved to <code className="rounded bg-muted px-1 font-mono">public/blog/</code>.
            </p>
          </div>
        </div>
        {title && (
          <p className="mt-3 text-xs text-muted-foreground">
            File: <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{suggestedFilename}</code>
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PenLineIcon className="size-4 text-primary/80" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Body
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadImage(f);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingImage}
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlusIcon className="size-4" />
              {uploadingImage ? "Uploading…" : "Upload image"}
            </Button>
            {imageMessage && (
              <span
                className={`text-xs ${imageMessage.type === "ok" ? "text-primary" : "text-destructive"}`}
              >
                {imageMessage.text}
              </span>
            )}
          </div>
        </div>
        <div
          data-color-mode={colorMode}
          className="chronicles-mde overflow-hidden rounded-xl border border-input bg-background shadow-inner"
        >
          <MDEditor value={value} onChange={(v) => setValue(v ?? "")} height={420} />
        </div>
      </section>

      {(() => {
          const preview = getPreviewFromValue(value, { title, date, excerpt, image });
          return (
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-7">
        <div className="mb-5 flex items-center gap-2">
          <EyeIcon className="size-4 text-primary/80" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Live preview
          </h2>
          <span className="text-xs text-muted-foreground/80">(no publish — how it will look)</span>
        </div>
        <div className="min-w-0 overflow-x-hidden rounded-xl border border-dashed border-border bg-muted/20 p-6 md:p-8">
          <article className="blog-article min-w-0 max-w-full">
            <div className="mb-6 h-1 w-12 rounded-full bg-primary/80 md:mb-8" aria-hidden />
            <header className="mb-10 md:mb-14 min-w-0">
              {preview.image && (
                <div className="mb-8 max-h-[380px] min-w-0 overflow-hidden rounded-xl border border-border bg-muted/30 shadow-sm md:mb-10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview.image}
                    alt=""
                    className="h-auto max-h-[380px] w-full max-w-full object-cover"
                    width={680}
                    height={380}
                    aria-hidden
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                </div>
              )}
              <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <time dateTime={preview.date} className="flex items-center gap-2 font-medium">
                  <CalendarIcon className="size-4" />
                  {formatPreviewDate(preview.date) || "No date"}
                </time>
                <span className="flex items-center gap-2 font-medium">
                  <Clock className="size-4" />
                  {formatReadTime(getReadTimeMinutes(preview.body || ""))}
                </span>
                <span className="text-muted-foreground/60" aria-hidden>·</span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-foreground">
                  {RESUME_DATA.name}
                </span>
              </div>
              <h3 className="min-w-0 break-words text-3xl font-bold tracking-tight text-foreground md:text-4xl md:leading-[1.15]">
                {preview.title || "Untitled"}
              </h3>
              {preview.excerpt && (
                <p className="mt-4 min-w-0 break-words text-lg leading-relaxed text-muted-foreground">
                  {preview.excerpt}
                </p>
              )}
            </header>
            <div className="blog-body min-w-0 max-w-full break-words [&_a]:break-all [&_img]:max-w-full [&_img]:h-auto">
              {preview.body ? <MarkdownContent content={preview.body} /> : <p className="text-muted-foreground">Body content will appear here…</p>}
            </div>
          </article>
        </div>
      </section>
          );
        })()}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
          When you save, your tale is written to the chronicle. Locally it goes to <code className="rounded bg-muted px-1 font-mono">content/blog/</code>; on prod, download the leaf and add it to your chronicle.
        </p>
        {saveMessage && (
          <p
            className={`mb-4 rounded-lg px-3 py-2 text-sm ${saveMessage.type === "ok" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}
          >
            {saveMessage.text}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={saveToRepo} disabled={saving || !title?.trim()} className="gap-2">
              <SaveIcon className="size-4" />
              {saving ? "Inking…" : "Commit to the chronicle"}
            </Button>
            <Button onClick={copyToClipboard} variant="outline" className="gap-2">
              <CopyIcon className="size-4" />
              {copied ? "Copied!" : "Copy this tale"}
            </Button>
            <Button variant="outline" onClick={download} className="gap-2">
              <DownloadIcon className="size-4" />
              Download this leaf
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
            <span className="truncate font-mono text-xs text-muted-foreground">
              <code className="rounded bg-muted px-1.5 py-0.5">content/blog/{suggestedFilename}</code>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 gap-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              asChild
            >
              <Link href="/chronicle">
                <ExternalLinkIcon className="size-4" />
                Open the chronicle
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
