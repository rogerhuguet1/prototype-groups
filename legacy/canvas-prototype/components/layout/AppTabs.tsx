"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/utils/cx";
import { t } from "@/lib/i18n/strings";

const TABS = [
  { href: "/grupos", label: t.tabs.groups },
  { href: "/historial", label: t.tabs.history },
  { href: "/configuracion", label: t.tabs.config },
] as const;

export function AppTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Secciones"
      className="border-b border-rbx-border bg-white"
    >
      <div className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-2 sm:px-4">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cx(
                "relative inline-flex items-center px-4 py-3 text-sm font-medium transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-rbx-primary",
                active
                  ? "text-rbx-primary"
                  : "text-rbx-text-secondary hover:text-rbx-text-primary",
              )}
              aria-current={active ? "page" : undefined}
            >
              {tab.label}
              <span
                aria-hidden
                className={cx(
                  "absolute inset-x-3 bottom-0 h-0.5 rounded-full",
                  active ? "bg-rbx-primary" : "bg-transparent",
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
