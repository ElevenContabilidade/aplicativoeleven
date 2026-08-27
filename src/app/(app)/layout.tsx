"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { EleveMark } from "@/components/brand/logo";
import { useAuthStore } from "@/lib/store/auth-store";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, kind, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || kind !== "equipe")) router.replace("/login");
  }, [isAuthenticated, kind, hasHydrated, router]);

  if (!hasHydrated || !isAuthenticated || kind !== "equipe") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-wine-950">
        <EleveMark className="size-10 animate-pulse text-cream-200" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
