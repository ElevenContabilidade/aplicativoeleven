"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/app-store";
import type { TipoDocumentoRecorrente, EnvioMensalDocumento, StatusEnvioMensal } from "@/lib/types";

interface TipoRow {
  id: string;
  cliente_id: string;
  nome: string;
  ativo: boolean;
  criado_em: string;
}

interface EnvioRow {
  id: string;
  cliente_id: string;
  tipo_id: string;
  competencia: string;
  status: string;
  documento_id: string | null;
}

function mapTipo(row: TipoRow): TipoDocumentoRecorrente {
  return { id: row.id, clienteId: row.cliente_id, nome: row.nome, ativo: row.ativo, criadoEm: row.criado_em };
}

function mapEnvio(row: EnvioRow): EnvioMensalDocumento {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    tipoId: row.tipo_id,
    competencia: row.competencia,
    status: row.status as StatusEnvioMensal,
    documentoId: row.documento_id ?? undefined,
  };
}

/** Checklist mensal de documentos do cliente (grid ano x mês do Portal) —
 * sincroniza os tipos recorrentes configurados pela equipe e o status de
 * envio de cada um por competência. */
export function useSupabaseChecklistMensalSync(active: boolean) {
  const setTiposDocumentoRecorrenteFromSupabase = useAppStore((s) => s.setTiposDocumentoRecorrenteFromSupabase);
  const setEnviosMensaisDocumentoFromSupabase = useAppStore((s) => s.setEnviosMensaisDocumentoFromSupabase);

  useEffect(() => {
    if (!active) return;
    const supabase = createClient();
    let cancelled = false;

    async function loadAll() {
      const [tiposRes, enviosRes] = await Promise.all([
        supabase.from("tipos_documento_recorrente").select("*").order("criado_em"),
        supabase.from("envios_mensais_documento").select("*"),
      ]);
      if (cancelled) return;
      if (tiposRes.error) console.error("Erro ao carregar tipos de documento recorrente:", tiposRes.error.message);
      if (enviosRes.error) console.error("Erro ao carregar envios mensais:", enviosRes.error.message);
      if (tiposRes.data) setTiposDocumentoRecorrenteFromSupabase(tiposRes.data.map(mapTipo));
      if (enviosRes.data) setEnviosMensaisDocumentoFromSupabase(enviosRes.data.map(mapEnvio));
    }

    void loadAll();

    const channel = supabase
      .channel("checklist-mensal-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "tipos_documento_recorrente" }, () => void loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "envios_mensais_documento" }, () => void loadAll())
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [active, setTiposDocumentoRecorrenteFromSupabase, setEnviosMensaisDocumentoFromSupabase]);
}
