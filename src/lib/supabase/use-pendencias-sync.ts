"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/app-store";
import type { Pendencia, PendenciaTipo, PendenciaStatus } from "@/lib/types";

interface PendenciaRow {
  id: string;
  cliente_id: string;
  titulo: string;
  tipo: string;
  prazo: string | null;
  status: string;
  responsavel_id: string | null;
  criado_em: string;
}

function mapRow(row: PendenciaRow): Pendencia {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    titulo: row.titulo,
    tipo: row.tipo as PendenciaTipo,
    prazo: row.prazo ?? undefined,
    status: row.status as PendenciaStatus,
    responsavelId: row.responsavel_id ?? undefined,
    criadoEm: row.criado_em,
  };
}

/** Painel de pendências (o que o escritório está aguardando de cada cliente)
 * — equipe gerencia pelo Cliente 360, cliente só visualiza no Portal. */
export function useSupabasePendenciasSync(active: boolean) {
  const setPendenciasFromSupabase = useAppStore((s) => s.setPendenciasFromSupabase);

  useEffect(() => {
    if (!active) return;
    const supabase = createClient();
    let cancelled = false;

    async function loadAll() {
      const { data, error } = await supabase.from("pendencias").select("*").order("criado_em", { ascending: false });
      if (cancelled) return;
      if (error) console.error("Erro ao carregar pendências:", error.message);
      if (data) setPendenciasFromSupabase(data.map(mapRow));
    }

    void loadAll();

    const channel = supabase
      .channel("pendencias-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "pendencias" }, () => void loadAll())
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [active, setPendenciasFromSupabase]);
}
