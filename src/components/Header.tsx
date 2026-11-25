"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { mainNav, site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Pages with a dark full-bleed hero get a transparent header until scrolled.
  // Always the light bar, as in the design mockup (kept as a flag in case you want a transparent header later).
  const overHero = false;
  void scrolled;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-700 ease-[var(--ease-lux)]",
          overHero ? "bg-transparent py-6" : "bg-ivory/95 py-3 shadow-[0_1px_0_rgba(52,59,49,0.08)] backdrop-blur-xl",
        )}
      >
        <div className="container-lux flex items-center justify-between gap-6">
          <Logo light={overHero} />
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "relative text-[13.5px] transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-500 hover:after:scale-x-100",
                      overHero ? "text-ivory/90 hover:text-ivory" : "text-olive/80 hover:text-olive",
                      isActive(item.href) && "after:scale-x-100",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/join"
              className={cn(
                "hidden rounded-full px-6 py-3 text-[13.5px] font-medium transition-all duration-500 sm:inline-flex",
                overHero ? "bg-ivory text-olive hover:bg-champagne-light" : "bg-olive text-ivory hover:bg-ink",
              )}
            >
              Join the Club
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
              className={cn("flex h-11 w-11 items-center justify-center rounded-full lg:hidden", overHero ? "text-ivory" : "text-olive")}
            >
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={cn(
          "fixed inset-0 z-[60] flex flex-col bg-olive text-ivory transition-all duration-700 ease-[var(--ease-lux)] lg:hidden",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <div className="container-lux flex items-center justify-between py-6">
          <Logo light />
          <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory/20">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        <nav aria-label="Mobile" className="container-lux flex flex-1 flex-col justify-center">
          <ul className="space-y-2">
            {[...mainNav, { href: "/faq", label: "FAQ" }, { href: "/contact", label: "Contact" }].map((item, i) => (
              <li
                key={item.href}
                className={cn("transition-all duration-700 ease-[var(--ease-lux)]", open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0")}
                style={{ transitionDelay: open ? `${120 + i * 50}ms` : "0ms" }}
              >
                <Link href={item.href} className={cn("block py-1.5 font-serif text-4xl sm:text-5xl", isActive(item.href) ? "italic text-champagne" : "text-ivory")}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="container-lux pb-10">
          <Link href="/join" className="flex w-full items-center justify-center rounded-full bg-terracotta py-4 text-[13px] font-medium uppercase tracking-[0.18em]">
            Join the Club — it&apos;s free
          </Link>
          <p className="mt-6 text-center text-xs tracking-wide text-ivory/50">{site.tagline}</p>
        </div>
      </div>
    </>
  );
}
