"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";
import oneLight from "react-syntax-highlighter/dist/esm/styles/prism/one-light";
import vscDarkPlus from "react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus";
import { slugifyHeading } from "@/lib/headings";
import { useTheme } from "next-themes";

SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("java", java);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("sql", sql);
SyntaxHighlighter.registerLanguage("yaml", yaml);

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

function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const language = className ? className.replace(/language-/, "") : "text";
  const code = String(children).replace(/\n$/, "");
  const style = resolvedTheme === "dark" ? vscDarkPlus : oneLight;

  return (
    <SyntaxHighlighter
      language={language}
      style={style}
      customStyle={{
        margin: 0,
        padding: 0,
        background: "transparent",
        fontSize: "0.875rem",
        lineHeight: 1.6,
      }}
      codeTagProps={{
        style: {
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          fontWeight: 400,
        },
      }}
      lineProps={() => ({
        style: { backgroundColor: "transparent", display: "block" },
      })}
    >
      {code}
    </SyntaxHighlighter>
  );
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
          return <CodeBlock className={className}>{children}</CodeBlock>;
        },
        pre: ({ children }) => <pre>{children}</pre>,
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
