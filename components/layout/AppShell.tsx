"use client";

import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { AppTabs } from "./AppTabs";
import { ToastStack } from "@/components/ui/Toast";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-rbx-background">
      <AppHeader />
      <AppTabs />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-3 py-4 sm:px-6 sm:py-6">
        {children}
      </main>
      <ToastStack />
    </div>
  );
}
