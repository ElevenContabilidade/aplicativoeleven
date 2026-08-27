"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EleveMark } from "@/components/brand/logo";
import { useAuthStore } from "@/lib/store/auth-store";

export default function RootGate() {
  const router = useRouter();
  const { isAuthenticated, kind, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated) {
      router.replace(kind === "cliente" ? "/portal" : "/dashboard");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, kind, hasHydrated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-wine-950">
      <EleveMark className="size-10 animate-pulse text-cream-200" />
    </div>
  );
}
