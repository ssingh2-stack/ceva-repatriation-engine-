"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Accounts" },
  { href: "/funnel", label: "Funnel" },
  { href: "/sequence", label: "Sequences" },
  { href: "/activity", label: "Signals" },
];

export function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="border-b border-edge bg-white/80 sticky top-0 z-10 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center gap-5">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight shrink-0">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent text-white text-[11px] font-bold">
            C
          </span>
          <span>
            CEVA <span className="text-muted font-normal">Repatriation Signal Engine</span>
          </span>
        </Link>
        <nav className="flex gap-0.5 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isActive(l.href)
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-muted hover:text-strong hover:bg-panel"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <span className="ml-auto text-xs text-muted hidden md:block">GTA funeral homes · repatriation logistics</span>
      </div>
    </header>
  );
}
