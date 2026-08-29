"use client";

import { useState, type ReactNode } from "react";
import { Sidebar, SidebarNav } from "./sidebar";
import { Topbar } from "./topbar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { EleveLogo } from "@/components/brand/logo";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-sand-50">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="flex w-72 flex-col p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex min-h-16 shrink-0 items-center px-4 py-3">
            <EleveLogo variant="cream" markClassName="h-7 w-7" showTagline />
          </div>
          <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
