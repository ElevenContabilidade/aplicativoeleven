"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EleveMark } from "@/components/brand/logo";
import { useAuthStore } from "@/lib/store/auth-store";
import { useAppStore } from "@/lib/store/app-store";
import { moduloDaRota, temPermissao } from "@/lib/permissoes";
import { useSupabaseTeamSync } from "@/lib/supabase/use-team-sync";
import { useSupabaseDocumentosSync } from "@/lib/supabase/use-documentos-sync";
import { useSupabasePendenciasSync } from "@/lib/supabase/use-pendencias-sync";
import { createClient } from "@/lib/supabase/client";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, kind, userId, hasHydrated, logout } = useAuthStore();
  const permissoes = useAppStore((s) => s.permissoes);
  const team = useAppStore((s) => s.team);

  useSupabaseTeamSync(hasHydrated && isAuthenticated && kind === "equipe");
  useSupabaseDocumentosSync(hasHydrated && isAuthenticated && kind === "equipe");
  useSupabasePendenciasSync(hasHydrated && isAuthenticated && kind === "equipe");

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || kind !== "equipe")) router.replace("/login");
  }, [isAuthenticated, kind, hasHydrated, router]);

  // A sessão "lembrada" localmente pode não valer mais (expirou, foi
  // encerrada em outro lugar) — confirma com o Supabase que ainda é
  // válida, senão desloga de verdade em vez de deixar a tela presa
  // achando que está autenticado.
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || kind !== "equipe") return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        logout();
        router.replace("/login");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, isAuthenticated, kind]);

  if (!hasHydrated || !isAuthenticated || kind !== "equipe") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-wine-950">
        <EleveMark className="size-10 animate-pulse text-cream-200" />
      </div>
    );
  }

  const modulo = moduloDaRota(pathname);
  const colaborador = team.find((m) => m.id === userId);
  // A tela de Equipe controla as permissões de todo mundo — só Administrador
  // acessa, e essa regra é fixa (não passa pela matriz de permissões
  // granular), senão alguém poderia se auto-liberar acesso por lá.
  const somenteAdmin = modulo === "Equipe" && colaborador?.perfil !== "Administrador";
  const podeVisualizar = !somenteAdmin && (!modulo || !userId || temPermissao(permissoes, userId, modulo, "Visualizar"));

  return (
    <AppShell>
      {podeVisualizar ? (
        children
      ) : (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
          <ShieldAlert className="size-10 text-sand-300" />
          <p className="text-lg font-semibold text-sand-800">Acesso restrito</p>
          <p className="max-w-sm text-sm text-sand-500">
            {somenteAdmin
              ? "Só administradores podem acessar a Equipe e gerenciar permissões."
              : `Você não tem permissão para visualizar o módulo ${modulo}. Fale com um administrador se precisar de acesso.`}
          </p>
        </div>
      )}
    </AppShell>
  );
}
