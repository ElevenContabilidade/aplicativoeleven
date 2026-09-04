"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/app-store";
import type { Documento, DocumentoCategoria } from "@/lib/types";

interface DocumentRow {
  id: string;
  cliente_id: string;
  nome: string;
  categoria: string;
  data_arquivo: string;
  responsavel_id: string | null;
  tamanho: string;
  drive_link: string | null;
}

function mapRow(row: DocumentRow): Documento {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    nome: row.nome,
    categoria: row.categoria as DocumentoCategoria,
    dataArquivo: row.data_arquivo,
    responsavelId: row.responsavel_id ?? "",
    tamanho: row.tamanho,
    url: row.drive_link ?? undefined,
  };
}

/** Documentos agora vivem no Supabase (antes ficavam só no navegador de
 * quem anexou, presos a um object URL que sumia ao recarregar a página).
 * `active` roda tanto pra equipe (autenticada no Supabase) quanto pro
 * Portal do Cliente (ainda sem Supabase Auth, lê via policy pública de
 * select). */
export function useSupabaseDocumentosSync(active: boolean) {
  const setDocumentosFromSupabase = useAppStore((s) => s.setDocumentosFromSupabase);

  useEffect(() => {
    if (!active) return;
    const supabase = createClient();
    let cancelled = false;

    async function loadAll() {
      const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) console.error("Erro ao carregar documentos:", error.message);
      if (data) setDocumentosFromSupabase(data.map(mapRow));
    }

    void loadAll();

    const channel = supabase
      .channel("documents-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, () => void loadAll())
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [active, setDocumentosFromSupabase]);
}
