import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const GITHUB_API = "https://api.github.com";

async function saveViaGitHub(
  repo: string,
  token: string,
  filename: string,
  content: string
): Promise<{ ok: true; path: string } | { error: string }> {
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

  let sha: string | undefined;
  try {
    const getRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repoName}/contents/${filePath}`,
      { headers }
    );
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    } else if (getRes.status !== 404) {
      const err = await getRes.text();
      return { error: `GitHub: ${err || getRes.statusText}` };
    }
  } catch (e) {
    return { error: "GitHub API request failed" };
  }

  const body = {
    message: sha ? `Update ${filename}` : `Add ${filename}`,
    content: Buffer.from(content, "utf-8").toString("base64"),
    ...(sha && { sha }),
  };

  const putRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repoName}/contents/${filePath}`,
    {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    return {
      error: (err as { message?: string }).message || putRes.statusText || "GitHub save failed",
    };
  }
  return { ok: true, path: filePath };
}

export async function POST(request: NextRequest) {
  const secret = process.env.BLOG_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Save not configured (set BLOG_SECRET)" },
      { status: 503 }
    );
  }

  let body: { key?: string; filename?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.key !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filename = body.filename?.trim();
  const content = body.content;

  if (!filename || typeof content !== "string") {
    return NextResponse.json(
      { error: "Missing filename or content" },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9-]+\.md$/.test(filename)) {
    return NextResponse.json(
      { error: "Filename must be lowercase, alphanumeric with hyphens, ending in .md" },
      { status: 400 }
    );
  }

  const postsDir = path.join(process.cwd(), "content", "blog");
  const filePath = path.join(postsDir, filename);
  if (!filePath.startsWith(postsDir)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  // 1. Try local filesystem (works when running locally)
  try {
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, "utf-8");
    return NextResponse.json({ ok: true, path: `content/blog/${filename}` });
  } catch {
    // 2. Fallback: save via GitHub API (for Vercel / read-only deploy)
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO?.trim();

  if (!token || !repo) {
    return NextResponse.json(
      {
        error:
          "Save on deploy requires GITHUB_TOKEN and GITHUB_REPO in environment. Use Download for now.",
      },
      { status: 503 }
    );
  }

  const result = await saveViaGitHub(repo, token, filename, content);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, path: result.path });
}
