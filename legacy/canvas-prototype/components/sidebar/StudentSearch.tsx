"use client";

import { useGroupingStore } from "@/lib/store/use-grouping-store";
import { Input } from "@/components/ui/Input";
import { t } from "@/lib/i18n/strings";

export function StudentSearch() {
  const value = useGroupingStore((s) => s.searchQuery);
  const setValue = useGroupingStore((s) => s.setSearchQuery);
  return (
    <Input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={t.sidebar.search_placeholder}
      aria-label={t.sidebar.search_placeholder}
      leadingIcon={
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      }
    />
  );
}
