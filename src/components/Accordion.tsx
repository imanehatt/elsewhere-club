"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  title: React.ReactNode;
  kicker?: string;
  content: React.ReactNode;
}

export function Accordion({ items, defaultOpen = 0, className }: { items: AccordionItem[]; defaultOpen?: number | null; className?: string }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const id = useId();
  return (
    <div className={cn("divide-y divide-olive/10 border-y border-olive/10", className)}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <h3 className="font-sans">
              <button
                type="button"
                id={`${id}-h${i}`}
                aria-expanded={isOpen}
                aria-controls={`${id}-p${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center gap-5 py-5 text-left"
              >
                {item.kicker && <span className="w-14 shrink-0 text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">{item.kicker}</span>}
                <span className="flex-1 font-serif text-lg text-olive sm:text-xl">{item.title}</span>
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-olive/15 transition-transform duration-500", isOpen && "rotate-45 bg-olive text-ivory")}>
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            </h3>
            <div
              id={`${id}-p${i}`}
              role="region"
              aria-labelledby={`${id}-h${i}`}
              className={cn("grid transition-[grid-template-rows] duration-500 ease-[var(--ease-lux)]", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
            >
              <div className="overflow-hidden">
                <div className={cn("pb-6 text-[15px] leading-relaxed text-olive-soft", item.kicker && "sm:pl-[4.75rem]")}>{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
