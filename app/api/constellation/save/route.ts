import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DREAMS_FILE, DREAMS_REPO_PATH, sanitizeDreams } from "@/lib/dreams";

const GITHUB_API = "https://api.github.com";

async function saveViaGitHub(
  repo: string,
  token: string,
  content: string
): Promise<{ ok: true } | { error: string }> {
  const [owner, repoName] = repo.split("/").filter(Boolean);
  if (owner === undefined || repoName === undefined) {
    return { error: "Invalid GITHUB_REPO (use owner/repo)" };
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const url = `${GITHUB_API}/repos/${owner}/${repoName}/contents/${DREAMS_REPO_PATH}`;

  let sha: string | undefined;
  try {
    const getRes = await fetch(url, { headers, cache: "no-store" });
    if (getRes.ok) {
      sha = (await getRes.json()).sha;
    } else if (getRes.status !== 404) {
      const err = await getRes.text();
      return { error: `GitHub: ${err || getRes.statusText}` };
    }
  } catch {
    return { error: "GitHub API request failed" };
  }

  const putRes = await fetch(url, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Update constellation dreams",
      content: Buffer.from(content, "utf-8").toString("base64"),
      ...(sha && { sha }),
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    return {
      error: (err as { message?: string }).message || putRes.statusText || "GitHub save failed",
    };
  }
  return { ok: true };
}

export async function POST(request: NextRequest) {
  const secret = process.env.BLOG_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Save not configured (set BLOG_SECRET)" }, { status: 503 });
  }

  let body: { key?: string; dreams?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.key !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dreams = sanitizeDreams(body.dreams);
  if (!dreams) {
    return NextResponse.json({ error: "Malformed dreams payload" }, { status: 400 });
  }
  const content = JSON.stringify(dreams, null, 2) + "\n";

  // 1. Try local filesystem (works when running locally)
  try {
    fs.mkdirSync(path.dirname(DREAMS_FILE), { recursive: true });
    fs.writeFileSync(DREAMS_FILE, content, "utf-8");
    return NextResponse.json({ ok: true });
  } catch {
    // 2. Fallback: save via GitHub API (for Vercel / read-only deploy)
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO?.trim();
  if (!token || !repo) {
    return NextResponse.json(
      { error: "Save on deploy requires GITHUB_TOKEN and GITHUB_REPO in environment." },
      { status: 503 }
    );
  }

  const result = await saveViaGitHub(repo, token, content);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
