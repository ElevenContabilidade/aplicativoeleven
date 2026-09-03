"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/app-store";
import { permissaoKey } from "@/lib/permissoes";
import type { TeamMember } from "@/lib/types";

interface ProfileRow {
  id: string;
  nome: string;
  email: string;
  celular: string | null;
  perfil: string;
  departamentos: string[];
  avatar_color: string;
  ativo: boolean;
  clientes_vinculados: string[] | null;
}

interface PermissionRow {
  member_id: string;
  modulo: string;
  acao: string;
  allowed: boolean;
}

function mapProfileRow(row: ProfileRow): TeamMember {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    celular: row.celular ?? undefined,
    perfil: row.perfil as TeamMember["perfil"],
    departamentos: (row.departamentos ?? []) as TeamMember["departamentos"],
    avatarColor: row.avatar_color,
    ativo: row.ativo,
    clientesVinculados: row.clientes_vinculados ?? undefined,
    historico: [],
  };
}

function mapPermissionRows(rows: PermissionRow[]): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const r of rows) result[permissaoKey(r.member_id, r.modulo, r.acao)] = r.allowed;
  return result;
}

/** Busca colaboradores + permissões do Supabase e mantém em sincronia via
 * Realtime — é o que faz uma alteração feita no navegador de uma pessoa
 * aparecer no navegador das outras sem precisar recarregar a página. Só
 * roda quando `active` (sessão de equipe autenticada). */
export function useSupabaseTeamSync(active: boolean) {
  const setTeamFromSupabase = useAppStore((s) => s.setTeamFromSupabase);
  const setPermissoesFromSupabase = useAppStore((s) => s.setPermissoesFromSupabase);

  useEffect(() => {
    if (!active) return;
    const supabase = createClient();
    let cancelled = false;

    async function loadAll() {
      const [profilesRes, permsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("permissions").select("*"),
      ]);
      if (cancelled) return;
      if (profilesRes.error) console.error("Erro ao carregar colaboradores:", profilesRes.error.message);
      if (permsRes.error) console.error("Erro ao carregar permissões:", permsRes.error.message);
      if (profilesRes.data) setTeamFromSupabase(profilesRes.data.map(mapProfileRow));
      if (permsRes.data) setPermissoesFromSupabase(mapPermissionRows(permsRes.data));
    }

    void loadAll();

    const channel = supabase
      .channel("team-permissions-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => void loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "permissions" }, () => void loadAll())
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [active, setTeamFromSupabase, setPermissoesFromSupabase]);
}
