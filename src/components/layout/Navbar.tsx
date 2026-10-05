"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/dashboard", label: "Painel" },
  { href: "/chat", label: "Chat" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-ink-700 bg-ink-950/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="focus-ring font-display text-lg font-semibold tracking-tight">
          KHM<span className="text-gold-500">.</span>sistemas
        </Link>
        <ul className="flex items-center gap-1 text-sm">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={clsx(
                    "focus-ring rounded-md px-3 py-1.5 transition-colors",
                    active
                      ? "bg-ink-800 text-paper-100"
                      : "text-paper-400 hover:text-paper-100",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
