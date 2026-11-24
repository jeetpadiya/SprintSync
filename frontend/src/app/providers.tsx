"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { authApi } from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Session Hydration Component
 * Validates the HttpOnly cookie with the backend on app start or page refresh,
 * restoring user state to Zustand so the user remains authenticated.
 */
function AuthHydration({ children }: { children: React.ReactNode }) {
  const { setUser, clearAuth } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    authApi
      .getMe()
      .then((res) => {
        if (isMounted && res.user) {
          setUser(res.user);
        }
      })
      .catch(() => {
        if (isMounted) {
          clearAuth();
        }
      });

    return () => {
      isMounted = false;
    };
  }, [setUser, clearAuth]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydration>{children}</AuthHydration>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--bg-elev)",
            borderColor: "var(--border)",
            color: "var(--text)",
            borderRadius: "var(--radius)",
            fontSize: "13px",
            letterSpacing: "-0.01em",
          },
        }}
      />
    </QueryClientProvider>
  );
}
