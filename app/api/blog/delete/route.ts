import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const GITHUB_API = "https://api.github.com";

async function deleteViaGitHub(
  repo: string,
  token: string,
  filename: string
): Promise<{ ok: true } | { error: string }> {
  const filePath = `content/blog/${filename}`;
  const [owner, repoName] = repo.split("/").filter(Boolean);
  if (owner === undefined || repoName === undefined) {
    return { error: "Invalid GITHUB_REPO (use owner/repo)" };
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };

  let sha: string;
  try {
    const getRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repoName}/contents/${filePath}`,
      { headers }
    );
    if (!getRes.ok) {
      if (getRes.status === 404) return { error: "Post not found in repo" };
      const err = await getRes.text();
      return { error: `GitHub: ${err || getRes.statusText}` };
    }
    const data = await getRes.json();
    sha = (data as { sha: string }).sha;
  } catch {
    return { error: "GitHub API request failed" };
  }

  const delRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repoName}/contents/${filePath}`,
    {
      method: "DELETE",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Remove ${filename}`, sha }),
    }
  );

  if (!delRes.ok) {
    const err = await delRes.json().catch(() => ({}));
    return {
      error: (err as { message?: string }).message || delRes.statusText || "GitHub delete failed",
    };
  }
  return { ok: true };
}

export async function POST(request: NextRequest) {
  const secret = process.env.BLOG_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Delete not configured (set BLOG_SECRET)" },
      { status: 503 }
    );
  }

  let body: { key?: string; slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.key !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = body.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Slug must be lowercase, alphanumeric with hyphens" },
      { status: 400 }
    );
  }

  const filename = `${slug}.md`;
  const postsDir = path.join(process.cwd(), "content", "blog");
  const filePath = path.join(postsDir, filename);
  if (!filePath.startsWith(postsDir)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  } catch {
    // Fallback: GitHub API when fs fails (e.g. deployed)
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO?.trim();
  if (!token || !repo) {
    return NextResponse.json(
      { error: "Delete on deploy requires GITHUB_TOKEN and GITHUB_REPO." },
      { status: 503 }
    );
  }

  const result = await deleteViaGitHub(repo, token, filename);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.error === "Post not found in repo" ? 404 : 500 });
  }
  return NextResponse.json({ ok: true });
}
