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
    <header className="sticky top-0 z-20 border-b border-rule bg-paper/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/"
          className="focus-ring font-display text-[0.9375rem] font-bold tracking-[-0.02em]"
        >
          KHM<span className="text-signal">/</span>sistemas
        </Link>

        {/* A sublinha do item ativo é o próprio fio da barra ficando grosso e
            azul: a navegação usa a mesma régua que estrutura o resto da página,
            em vez de uma pílula preenchida que não existe em nenhum outro lugar. */}
        <ul className="-mb-4 flex items-stretch gap-1 text-sm">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "focus-ring block border-b-2 px-3 pt-1 pb-4 transition-colors",
                    active
                      ? "border-signal text-ink"
                      : "border-transparent text-muted hover:text-ink",
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
