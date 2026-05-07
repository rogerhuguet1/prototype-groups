"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { StoresHydrator } from "@/components/layout/StoresHydrator";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <StoresHydrator />
      {children}
    </QueryClientProvider>
  );
}
