"use client";

import { useGroupingStore } from "@/lib/store/use-grouping-store";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n/strings";

export function AppHeader() {
  const sessionName = useGroupingStore((s) => s.sessionConfig.name);
  const saveSession = useGroupingStore((s) => s.saveSession);

  return (
    <header className="border-b border-rbx-border bg-white">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="hidden min-w-0 sm:block">
            <p className="text-xs uppercase tracking-wide text-rbx-text-secondary">
              {t.app.title} · {t.header.session_label}
            </p>
            <h1 className="truncate text-base font-semibold text-rbx-text-primary">
              {sessionName}
            </h1>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => saveSession()}>
          {t.header.save_session}
        </Button>
      </div>
    </header>
  );
}

/**
 * Logo provisional. NO es el logo oficial ROBOTIX (que sería SVG vectorial).
 * Se mantiene como placeholder hasta que se reciba el activo de marca real.
 */
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rbx-primary text-white">
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
          <circle cx="11" cy="11" r="2" fill="currentColor" />
          <circle cx="3.5" cy="11" r="1.5" fill="currentColor" />
          <circle cx="18.5" cy="11" r="1.5" fill="currentColor" />
        </svg>
      </span>
      <span className="hidden text-base font-semibold text-rbx-text-primary sm:inline">
        VisualGroups
      </span>
    </div>
  );
}
