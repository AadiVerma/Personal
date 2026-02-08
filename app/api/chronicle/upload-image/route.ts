import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const GITHUB_API = "https://api.github.com";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

function safeName(original: string, mime: string): string {
  const base = original
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9-]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "image";
  const ext = EXT[mime] || ".png";
  return `${base}${ext}`;
}

async function saveImageViaGitHub(
  repo: string,
  token: string,
  filename: string,
  contentBase64: string
): Promise<{ ok: true; path: string } | { error: string }> {
  const filePath = `public/blog/${filename}`;
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
  } catch {
    return { error: "GitHub API request failed" };
  }

  const body = {
    message: sha ? `Update ${filename}` : `Add ${filename}`,
    content: contentBase64,
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
    const err = await putRes.json().catch(() => ({})) as { message?: string; error?: string };
    const msg = err.message || err.error || putRes.statusText || "GitHub upload failed";
    return { error: `GitHub: ${msg}` };
  }
  return { ok: true, path: `/blog/${filename}` };
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.BLOG_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Upload not configured (set BLOG_SECRET)" },
        { status: 503 }
      );
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const key = formData.get("key");
    if (key !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const file = formData.get("file");
    const isFileLike = file && typeof file === "object" && "arrayBuffer" in file && "name" in file;
    if (!isFileLike) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    const fileObj = file as { type?: string; name: string; arrayBuffer(): Promise<ArrayBuffer> };

    const mime = fileObj.type || "";
    const allowed = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    const byExt: Record<string, string> = { png: ".png", jpg: ".jpg", jpeg: ".jpg", gif: ".gif", webp: ".webp" };
    const extFromName = fileObj.name.split(".").pop()?.toLowerCase();
    const isAllowed = allowed.includes(mime) || (extFromName && extFromName in byExt);
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Only PNG, JPEG, GIF, and WebP are allowed" },
        { status: 400 }
      );
    }
    const mimeForExt = mime || (extFromName && extFromName in byExt ? `image/${extFromName === "jpg" ? "jpeg" : extFromName}` : "image/png");

    const filename = safeName(fileObj.name, mimeForExt);
    if (!/^[a-z0-9-]+\.(png|jpg|jpeg|gif|webp)$/i.test(filename)) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    let buffer: Buffer;
    try {
      const bytes = await fileObj.arrayBuffer();
      buffer = Buffer.from(bytes);
    } catch {
      return NextResponse.json({ error: "Failed to read file" }, { status: 400 });
    }

    const publicBlog = path.join(process.cwd(), "public", "blog");
    const filePath = path.join(publicBlog, filename);
    const publicBlogResolved = path.resolve(publicBlog);
    const filePathResolved = path.resolve(filePath);
    if (!filePathResolved.startsWith(publicBlogResolved)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    let localWriteFailed: string | null = null;
    try {
      if (!fs.existsSync(publicBlog)) {
        fs.mkdirSync(publicBlog, { recursive: true });
      }
      fs.writeFileSync(filePath, new Uint8Array(buffer));
      return NextResponse.json({ ok: true, path: `/blog/${filename}` });
    } catch (err) {
      localWriteFailed = err instanceof Error ? err.message : String(err);
    }

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO?.trim();
    if (!token || !repo) {
      return NextResponse.json(
        {
          error: localWriteFailed
            ? `Local save failed: ${localWriteFailed}. No GITHUB_TOKEN/GITHUB_REPO for fallback.`
            : "Upload on deploy requires GITHUB_TOKEN and GITHUB_REPO in env. Locally, check that public/blog is writable.",
        },
        { status: 503 }
      );
    }

    const contentBase64 = buffer.toString("base64");
    const result = await saveImageViaGitHub(repo, token, filename, contentBase64);
    if ("error" in result) {
      return NextResponse.json(
        { error: localWriteFailed ? `${result.error} (local write failed: ${localWriteFailed})` : result.error },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, path: result.path });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
