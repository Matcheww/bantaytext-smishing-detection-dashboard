"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MODEL_LIST } from "@/lib/models/metadata";

const primaryLinks = [{ href: "/", label: "Analyze" }];

const modelLinks = [
  ...MODEL_LIST.map((m) => ({ href: `/models/${m.slug}`, label: m.shortName })),
  { href: "/models/comparison", label: "Comparison" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [modelsOpen, setModelsOpen] = useState(false);
  const modelsSectionActive = pathname.startsWith("/models");

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-black/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
            B
          </span>
          BantayText
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                isActive(pathname, link.href)
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setModelsOpen(true)}
            onMouseLeave={() => setModelsOpen(false)}
          >
            <Link
              href="/models/comparison"
              className={`rounded-md px-3 py-1.5 transition-colors ${
                modelsSectionActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
              onClick={(e) => {
                // On touch devices there's no hover; let a tap open the menu first.
                if (window.matchMedia("(hover: none)").matches && !modelsOpen) {
                  e.preventDefault();
                  setModelsOpen(true);
                }
              }}
            >
              Models
            </Link>

            {modelsOpen && (
              <div className="absolute right-0 top-full w-48 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                {modelLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive(pathname, link.href)
                        ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/about"
            className={`rounded-md px-3 py-1.5 transition-colors ${
              isActive(pathname, "/about")
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
