"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { slugifyHeading } from "@/lib/headings";

const imageClassName =
  "rounded-lg border border-border w-full h-auto my-6 block";

function createHeadingId(children: React.ReactNode): string {
  const text = React.Children.toArray(children)
    .map((child) => {
      if (typeof child === "string") return child;
      if (typeof child === "number") return String(child);
      if (React.isValidElement(child) && child.props.children) {
        return createHeadingId(child.props.children);
      }
      return "";
    })
    .join("");

  return slugifyHeading(text);
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        code: ({ className, children }) => {
          const isInline = !className;
          if (isInline) {
            return <code>{children}</code>;
          }
          return <code className={className}>{children}</code>;
        },
        img: ({ src, alt }) => {
          if (!src) return null;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt ?? ""}
              className={imageClassName}
              loading="lazy"
            />
          );
        },
        h1: ({ children }) => {
          const id = createHeadingId(children);
          return <h1 id={id}>{children}</h1>;
        },
        h2: ({ children }) => {
          const id = createHeadingId(children);
          return <h2 id={id}>{children}</h2>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
