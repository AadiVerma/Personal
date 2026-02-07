"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { CopyIcon, DownloadIcon, ExternalLinkIcon, FileTextIcon, ImagePlusIcon, PenLineIcon, SaveIcon } from "lucide-react";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const FRONTMATTER_TEMPLATE = (title: string, excerpt: string) =>
  `---
title: "${title.replace(/"/g, '\\"')}"
date: "${new Date().toISOString().slice(0, 10)}"
excerpt: "${excerpt.replace(/"/g, '\\"')}"
---

`;

const inputClassName =
  "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

export function BlogEditor() {
  const { resolvedTheme } = useTheme();
  const [value, setValue] = useState("");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMessage, setImageMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const colorMode = resolvedTheme === "dark" ? "dark" : "light";

  const fullMarkdown = title
    ? FRONTMATTER_TEMPLATE(title, excerpt) + value
    : value;

  const slug =
    title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") || "untitled";
  const suggestedFilename = `${slug || "post"}.md`;

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
      const res = await fetch("/api/blog/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, filename: suggestedFilename, content: fullMarkdown }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveMessage({ type: "err", text: data.error || "Save failed. Use Download when on Vercel." });
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
        const res = await fetch("/api/blog/upload-image", { method: "POST", body: form });
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
        const imagePath = data.path as string;
        const alt = file.name.replace(/\.[^.]+$/, "");
        const markdown = `\n![${alt}](${imagePath})\n`;
        setValue((v) => v + markdown);
        setImageMessage({ type: "ok", text: `Added ${imagePath} to post` });
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

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        <p className="mb-4 text-xs text-muted-foreground">
          Save writes directly to <code className="rounded bg-muted px-1 font-mono">content/blog/</code> when running locally. On Vercel, use Download and add the file manually.
        </p>
        {saveMessage && (
          <p
            className={`mb-4 rounded-lg px-3 py-2 text-sm ${saveMessage.type === "ok" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}
          >
            {saveMessage.text}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={saveToRepo} disabled={saving || !title?.trim()} className="gap-2">
            <SaveIcon className="size-4" />
            {saving ? "Saving…" : "Save to content/blog/"}
          </Button>
          <Button onClick={copyToClipboard} variant="outline" className="gap-2">
            <CopyIcon className="size-4" />
            {copied ? "Copied!" : "Copy markdown"}
          </Button>
          <Button variant="outline" onClick={download} className="gap-2">
            <DownloadIcon className="size-4" />
            Download {suggestedFilename}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto gap-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            asChild
          >
            <Link href="/blog">
              <ExternalLinkIcon className="size-4" />
              View Chronicles
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
