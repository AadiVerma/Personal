"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const imageClassName =
  "rounded-lg border border-border w-full h-auto my-6 block";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
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
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
