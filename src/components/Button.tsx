import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "light" | "ghost" | "outline-light";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full py-3.5 text-[14px] font-medium transition-all duration-500 ease-[var(--ease-lux)] disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "px-7 bg-olive text-ivory shadow-[0_10px_24px_-14px_rgba(52,59,49,0.8)] hover:bg-ink hover:-translate-y-0.5",
  secondary: "px-7 bg-olive text-ivory hover:bg-ink hover:-translate-y-0.5",
  light: "px-7 bg-ivory text-olive hover:bg-white hover:-translate-y-0.5",
  ghost: "text-olive hover:text-terracotta",
  "outline-light": "px-7 border border-ivory/60 text-ivory backdrop-blur-sm hover:bg-ivory hover:text-olive",
};

export function buttonClass(variant: Variant = "primary", className?: string) {
  return cn(base, variants[variant], className);
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
  arrow = false,
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  arrow?: boolean;
}) {
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
      {arrow && <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
    </Link>
  );
}
