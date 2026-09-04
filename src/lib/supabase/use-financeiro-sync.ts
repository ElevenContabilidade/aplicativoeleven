"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/app-store";
import type {
  Client,
  Recebimento,
  Parcelamento,
  EnvioParcelamento,
  BoletoMensal,
  NotaFiscalMensal,
  RecebimentoParceiroMensal,
  DespesaAvulsa,
  PagamentoSistemaMensal,
} from "@/lib/types";

interface DadosFinanceirosRow {
  tipo: string;
  data: unknown;
}

/** Clientes + Financeiro inteiro (Etapa 3 da migração) — tudo guardado
 * numa única tabela genérica `dados_financeiros` (uma linha por item,
 * marcada por `tipo`). Roda tanto pra equipe (autenticada) quanto pro
 * Portal do Cliente e pra tela de Login (ainda sem Supabase Auth — leem
 * só `clients`, liberado por uma policy pública separada). */
export function useSupabaseFinanceiroSync(active: boolean) {
  const setClientsFromSupabase = useAppStore((s) => s.setClientsFromSupabase);
  const setRecebimentosFromSupabase = useAppStore((s) => s.setRecebimentosFromSupabase);
  const setParcelamentosFromSupabase = useAppStore((s) => s.setParcelamentosFromSupabase);
  const setEnviosParcelamentoFromSupabase = useAppStore((s) => s.setEnviosParcelamentoFromSupabase);
  const setBoletosMensaisFromSupabase = useAppStore((s) => s.setBoletosMensaisFromSupabase);
  const setNotasFiscaisMensaisFromSupabase = useAppStore((s) => s.setNotasFiscaisMensaisFromSupabase);
  const setRecebimentosParceiroFromSupabase = useAppStore((s) => s.setRecebimentosParceiroFromSupabase);
  const setDespesasAvulsasFromSupabase = useAppStore((s) => s.setDespesasAvulsasFromSupabase);
  const setPagamentosSistemasFromSupabase = useAppStore((s) => s.setPagamentosSistemasFromSupabase);

  useEffect(() => {
    if (!active) return;
    const supabase = createClient();
    let cancelled = false;

    async function loadAll() {
      const { data, error } = await supabase.from("dados_financeiros").select("tipo, data");
      if (cancelled) return;
      if (error) {
        console.error("Erro ao carregar Clientes/Financeiro:", error.message);
        return;
      }
      const rows = (data ?? []) as DadosFinanceirosRow[];
      function porTipo<T>(tipo: string): T[] {
        return rows.filter((r) => r.tipo === tipo).map((r) => r.data as T);
      }

      setClientsFromSupabase(porTipo<Client>("clients"));
      setRecebimentosFromSupabase(porTipo<Recebimento>("recebimentos"));
      setParcelamentosFromSupabase(porTipo<Parcelamento>("parcelamentos"));
      setEnviosParcelamentoFromSupabase(porTipo<EnvioParcelamento>("enviosParcelamento"));
      setBoletosMensaisFromSupabase(porTipo<BoletoMensal>("boletosMensais"));
      setNotasFiscaisMensaisFromSupabase(porTipo<NotaFiscalMensal>("notasFiscaisMensais"));
      setRecebimentosParceiroFromSupabase(porTipo<RecebimentoParceiroMensal>("recebimentosParceiro"));
      setDespesasAvulsasFromSupabase(porTipo<DespesaAvulsa>("despesasAvulsas"));
      setPagamentosSistemasFromSupabase(porTipo<PagamentoSistemaMensal>("pagamentosSistemas"));
    }

    void loadAll();

    const channel = supabase
      .channel("dados-financeiros-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "dados_financeiros" }, () => void loadAll())
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [
    active,
    setClientsFromSupabase,
    setRecebimentosFromSupabase,
    setParcelamentosFromSupabase,
    setEnviosParcelamentoFromSupabase,
    setBoletosMensaisFromSupabase,
    setNotasFiscaisMensaisFromSupabase,
    setRecebimentosParceiroFromSupabase,
    setDespesasAvulsasFromSupabase,
    setPagamentosSistemasFromSupabase,
  ]);
}
