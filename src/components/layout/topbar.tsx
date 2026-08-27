"use client";

import { useRouter } from "next/navigation";
import { Menu, LogOut, Settings, User } from "lucide-react";
import { GlobalSearch } from "./global-search";
import { QuickActions } from "./quick-actions";
import { NotificationsBell } from "./notifications-bell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/store/auth-store";
import { teamMember } from "@/lib/data/seed";
import { initials } from "@/lib/utils";

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const router = useRouter();
  const { userId, logout } = useAuthStore();
  const me = teamMember(userId ?? "") ?? { nome: "Usuário Eleven", perfil: "Administrador", email: "" };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-sand-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button onClick={onOpenMobileNav} className="flex size-9 items-center justify-center rounded-lg text-sand-500 hover:bg-sand-100 md:hidden">
        <Menu className="size-5" />
      </button>

      <div className="flex-1">
        <GlobalSearch />
      </div>

      <QuickActions />
      <NotificationsBell />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-sand-100">
            <Avatar className="size-8">
              <AvatarFallback>{initials(me.nome)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-xs font-semibold text-sand-900">{me.nome}</span>
              <span className="block text-[10px] text-sand-500">{me.perfil}</span>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => router.push("/configuracoes")}>
            <User className="size-3.5" /> Perfil
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push("/configuracoes")}>
            <Settings className="size-3.5" /> Configurações
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              logout();
              router.push("/login");
            }}
          >
            <LogOut className="size-3.5" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
