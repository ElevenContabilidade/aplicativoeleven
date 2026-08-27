"use client";

import { useRouter } from "next/navigation";
import { Plus, UsersRound, Building2, ListChecks, Scale, ShieldCheck, Wallet, FolderOpen, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const ACTIONS = [
  { label: "Novo lead", href: "/comercial?novo=lead", icon: UsersRound },
  { label: "Novo cliente", href: "/clientes?novo=1", icon: Building2 },
  { label: "Nova tarefa", href: "/tarefas?novo=1", icon: ListChecks },
  { label: "Novo processo societário", href: "/societario?novo=1", icon: Scale },
  { label: "Novo certificado", href: "/certificados?novo=1", icon: ShieldCheck },
  { label: "Novo recebimento", href: "/financeiro?novo=1", icon: Wallet },
  { label: "Novo documento", href: "/documentos?novo=1", icon: FolderOpen },
  { label: "Novo atendimento", href: "/atendimento?novo=1", icon: Headset },
];

export function QuickActions() {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5 px-2.5 sm:px-4">
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">Novo</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Ações rápidas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ACTIONS.map((a) => (
          <DropdownMenuItem key={a.href} onSelect={() => router.push(a.href)}>
            <a.icon className="size-3.5 text-wine-600" />
            {a.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
