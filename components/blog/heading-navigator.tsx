"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Heading } from "@/lib/headings";

export type { Heading };

export function HeadingNavigator({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);

  const visibleHeadings = useMemo(() => {
    const h1s = headings.filter((h) => h.level === 1);
    return h1s.length > 0 ? h1s : headings;
  }, [headings]);

  useEffect(() => {
    if (visibleHeadings.length === 0) return;

    const elements = visibleHeadings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target.id);

        if (visible.length > 0) {
          setActiveId(visible[0]);
        }
      },
      {
        rootMargin: "-40% 0px -55% 0px",
        threshold: 0,
      }
    );

    for (const el of elements) observer.observe(el);

    const firstVisible = elements.find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top <= window.innerHeight * 0.45;
    });
    if (firstVisible) setActiveId(firstVisible.id);

    return () => observer.disconnect();
  }, [visibleHeadings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const expand = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
    setIsExpanded(true);
  };

  const collapse = () => {
    hideTimeout.current = setTimeout(() => {
      setIsExpanded(false);
    }, 200);
  };

  if (visibleHeadings.length < 2) return null;

  return (
    <div
      className="fixed right-0 top-0 z-40 hidden h-screen w-20 lg:block"
      onMouseEnter={expand}
      onMouseLeave={collapse}
    >
      {/* Visible indicator rail */}
      <div
        className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col items-end gap-2.5 lg:right-5"
        aria-hidden="true"
      >
        {visibleHeadings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <span
              key={`rail-${heading.id}`}
              className={cn(
                "block h-1.5 rounded-full transition-all duration-200",
                isActive
                  ? "w-6 bg-primary"
                  : "w-4 bg-muted-foreground/30"
              )}
            />
          );
        })}
      </div>

      {/* Expandable panel */}
      <nav
        className={cn(
          "absolute right-full top-1/2 mr-3 max-h-[80vh] w-72 -translate-y-1/2 flex-col gap-1 overflow-y-auto rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-md transition-all duration-200",
          isExpanded
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-4 opacity-0"
        )}
        aria-label="Table of contents"
      >
        {visibleHeadings.map((heading) => {
          const isActive = activeId === heading.id;

          return (
            <button
              key={heading.id}
              type="button"
              onClick={() => handleClick(heading.id)}
              className={cn(
                "block w-full rounded-lg px-3 py-2 text-left text-sm leading-snug transition-colors",
                isActive
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={isActive ? "location" : undefined}
            >
              <span className="block w-full whitespace-normal break-words">
                {heading.text}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
