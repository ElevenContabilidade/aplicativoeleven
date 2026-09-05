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
  FaturamentoMensal,
  RecebimentoParceiroMensal,
  DespesaAvulsa,
  PagamentoSistemaMensal,
  Lead,
  Task,
  Obligation,
  ProcessoSocietario,
  Certificado,
  Anotacao,
  TimelineEvent,
  ServicoExtra,
  Licenca,
  Indicacao,
  ServicoPortfolio,
  ChecklistEntry,
  SistemaEscritorio,
  DadosEscritorio,
  ContratoAssinatura,
  Funcionario,
} from "@/lib/types";

interface DadosFinanceirosRow {
  tipo: string;
  data: unknown;
}

/** Todo módulo do Eleven Hub que não é só configuração de conta (Etapas 3
 * e 4 da migração) vive nessa única tabela genérica `dados_financeiros`
 * (uma linha por item, marcada por `tipo`). Roda tanto pra equipe
 * (autenticada) quanto pro Portal do Cliente e pra tela de Login (ainda
 * sem Supabase Auth — leem só `clients`, `obligations` e `certificados`,
 * liberados por policies públicas separadas). */
export function useSupabaseFinanceiroSync(active: boolean) {
  const setClientsFromSupabase = useAppStore((s) => s.setClientsFromSupabase);
  const setRecebimentosFromSupabase = useAppStore((s) => s.setRecebimentosFromSupabase);
  const setParcelamentosFromSupabase = useAppStore((s) => s.setParcelamentosFromSupabase);
  const setEnviosParcelamentoFromSupabase = useAppStore((s) => s.setEnviosParcelamentoFromSupabase);
  const setBoletosMensaisFromSupabase = useAppStore((s) => s.setBoletosMensaisFromSupabase);
  const setNotasFiscaisMensaisFromSupabase = useAppStore((s) => s.setNotasFiscaisMensaisFromSupabase);
  const setFaturamentoMensalFromSupabase = useAppStore((s) => s.setFaturamentoMensalFromSupabase);
  const setRecebimentosParceiroFromSupabase = useAppStore((s) => s.setRecebimentosParceiroFromSupabase);
  const setDespesasAvulsasFromSupabase = useAppStore((s) => s.setDespesasAvulsasFromSupabase);
  const setPagamentosSistemasFromSupabase = useAppStore((s) => s.setPagamentosSistemasFromSupabase);
  const setLeadsFromSupabase = useAppStore((s) => s.setLeadsFromSupabase);
  const setTasksFromSupabase = useAppStore((s) => s.setTasksFromSupabase);
  const setObligationsFromSupabase = useAppStore((s) => s.setObligationsFromSupabase);
  const setProcessosSocietariosFromSupabase = useAppStore((s) => s.setProcessosSocietariosFromSupabase);
  const setCertificadosFromSupabase = useAppStore((s) => s.setCertificadosFromSupabase);
  const setAnotacoesFromSupabase = useAppStore((s) => s.setAnotacoesFromSupabase);
  const setTimelineFromSupabase = useAppStore((s) => s.setTimelineFromSupabase);
  const setServicosExtrasFromSupabase = useAppStore((s) => s.setServicosExtrasFromSupabase);
  const setLicencasFromSupabase = useAppStore((s) => s.setLicencasFromSupabase);
  const setIndicacoesFromSupabase = useAppStore((s) => s.setIndicacoesFromSupabase);
  const setServicosPortfolioFromSupabase = useAppStore((s) => s.setServicosPortfolioFromSupabase);
  const setChecklistContabilFromSupabase = useAppStore((s) => s.setChecklistContabilFromSupabase);
  const setChecklistFiscalFromSupabase = useAppStore((s) => s.setChecklistFiscalFromSupabase);
  const setChecklistPessoalFromSupabase = useAppStore((s) => s.setChecklistPessoalFromSupabase);
  const setChecklistMeiFromSupabase = useAppStore((s) => s.setChecklistMeiFromSupabase);
  const setSistemasEscritorioFromSupabase = useAppStore((s) => s.setSistemasEscritorioFromSupabase);
  const setDadosEscritorioFromSupabase = useAppStore((s) => s.setDadosEscritorioFromSupabase);
  const setMetaMensalClientesFromSupabase = useAppStore((s) => s.setMetaMensalClientesFromSupabase);
  const setContratosAssinaturaFromSupabase = useAppStore((s) => s.setContratosAssinaturaFromSupabase);
  const setFuncionariosFromSupabase = useAppStore((s) => s.setFuncionariosFromSupabase);
  const applyNotificationsLidas = useAppStore((s) => s.applyNotificationsLidas);

  useEffect(() => {
    if (!active) return;
    const supabase = createClient();
    let cancelled = false;

    async function loadAll() {
      const { data, error } = await supabase.from("dados_financeiros").select("tipo, data");
      if (cancelled) return;
      if (error) {
        console.error("Erro ao carregar dados do Eleven Hub:", error.message);
        return;
      }
      const rows = (data ?? []) as DadosFinanceirosRow[];
      function porTipo<T>(tipo: string): T[] {
        return rows.filter((r) => r.tipo === tipo).map((r) => r.data as T);
      }
      function itemUnico<T>(tipo: string): T | undefined {
        return rows.find((r) => r.tipo === tipo)?.data as T | undefined;
      }

      setClientsFromSupabase(porTipo<Client>("clients"));
      setRecebimentosFromSupabase(porTipo<Recebimento>("recebimentos"));
      setParcelamentosFromSupabase(porTipo<Parcelamento>("parcelamentos"));
      setEnviosParcelamentoFromSupabase(porTipo<EnvioParcelamento>("enviosParcelamento"));
      setBoletosMensaisFromSupabase(porTipo<BoletoMensal>("boletosMensais"));
      setNotasFiscaisMensaisFromSupabase(porTipo<NotaFiscalMensal>("notasFiscaisMensais"));
      setFaturamentoMensalFromSupabase(porTipo<FaturamentoMensal>("faturamentoMensal"));
      setRecebimentosParceiroFromSupabase(porTipo<RecebimentoParceiroMensal>("recebimentosParceiro"));
      setDespesasAvulsasFromSupabase(porTipo<DespesaAvulsa>("despesasAvulsas"));
      setPagamentosSistemasFromSupabase(porTipo<PagamentoSistemaMensal>("pagamentosSistemas"));
      setLeadsFromSupabase(porTipo<Lead>("leads"));
      setTasksFromSupabase(porTipo<Task>("tasks"));
      setObligationsFromSupabase(porTipo<Obligation>("obligations"));
      setProcessosSocietariosFromSupabase(porTipo<ProcessoSocietario>("processosSocietarios"));
      setCertificadosFromSupabase(porTipo<Certificado>("certificados"));
      setAnotacoesFromSupabase(porTipo<Anotacao>("anotacoes"));
      setTimelineFromSupabase(porTipo<TimelineEvent>("timeline"));
      setServicosExtrasFromSupabase(porTipo<ServicoExtra>("servicosExtras"));
      setLicencasFromSupabase(porTipo<Licenca>("licencas"));
      setIndicacoesFromSupabase(porTipo<Indicacao>("indicacoes"));
      setServicosPortfolioFromSupabase(porTipo<ServicoPortfolio>("servicosPortfolio"));
      setChecklistContabilFromSupabase(porTipo<ChecklistEntry>("checklistContabil"));
      setChecklistFiscalFromSupabase(porTipo<ChecklistEntry>("checklistFiscal"));
      setChecklistPessoalFromSupabase(porTipo<ChecklistEntry>("checklistPessoal"));
      setChecklistMeiFromSupabase(porTipo<ChecklistEntry>("checklistMei"));
      setSistemasEscritorioFromSupabase(porTipo<SistemaEscritorio>("sistemasEscritorio"));
      setContratosAssinaturaFromSupabase(porTipo<ContratoAssinatura>("contratosAssinatura"));
      setFuncionariosFromSupabase(porTipo<Funcionario>("funcionarios"));

      const dadosEscritorio = itemUnico<DadosEscritorio>("dadosEscritorio");
      if (dadosEscritorio) setDadosEscritorioFromSupabase(dadosEscritorio);
      const meta = itemUnico<{ valor: number }>("metaMensalClientes");
      if (meta) setMetaMensalClientesFromSupabase(meta.valor);

      const idsLidos = porTipo<{ id: string }>("notificacoesLidas").map((n) => n.id);
      if (idsLidos.length > 0) applyNotificationsLidas(idsLidos);
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
    setFaturamentoMensalFromSupabase,
    setRecebimentosParceiroFromSupabase,
    setDespesasAvulsasFromSupabase,
    setPagamentosSistemasFromSupabase,
    setLeadsFromSupabase,
    setTasksFromSupabase,
    setObligationsFromSupabase,
    setProcessosSocietariosFromSupabase,
    setCertificadosFromSupabase,
    setAnotacoesFromSupabase,
    setTimelineFromSupabase,
    setServicosExtrasFromSupabase,
    setLicencasFromSupabase,
    setIndicacoesFromSupabase,
    setServicosPortfolioFromSupabase,
    setChecklistContabilFromSupabase,
    setChecklistFiscalFromSupabase,
    setChecklistPessoalFromSupabase,
    setChecklistMeiFromSupabase,
    setSistemasEscritorioFromSupabase,
    setDadosEscritorioFromSupabase,
    setMetaMensalClientesFromSupabase,
    setContratosAssinaturaFromSupabase,
    setFuncionariosFromSupabase,
    applyNotificationsLidas,
  ]);
}
