"use client";

import { useEffect, useState } from "react";
import { scrollToId } from "@/lib/smooth-scroll";

export interface NavItem {
  id: string;
  label: string;
}

/** Section index that follows you down the report and highlights where you are. */
export function ReportNav({ items }: { items: NavItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const idKey = items.map((i) => i.id).join(",");

  useEffect(() => {
    const els = idKey
      .split(",")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [idKey]);

  return (
    <nav
      aria-label="Report sections"
      className="sticky top-16 z-30 -mx-4 mb-8 flex gap-2 overflow-x-auto bg-background/85 px-4 py-2.5 backdrop-blur-xl lg:top-28 lg:mx-0 lg:mb-0 lg:flex-col lg:gap-0.5 lg:self-start lg:overflow-visible lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
    >
      {items.map((item) => {
        const on = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToId(item.id)}
            aria-current={on ? "true" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors lg:rounded-none lg:border-0 lg:border-l-2 lg:px-4 lg:py-2 lg:text-left ${
              on
                ? "border-accent bg-accent-muted font-semibold text-accent-ink lg:bg-transparent lg:text-foreground"
                : "border-border text-muted hover:text-foreground lg:border-border"
            } ${on ? "lg:border-accent" : ""}`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
