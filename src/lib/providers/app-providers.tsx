"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { CookieBanner } from "@/components/cookie-banner";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false
      }
    }
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <CookieBanner />
    </QueryClientProvider>
  );
}
