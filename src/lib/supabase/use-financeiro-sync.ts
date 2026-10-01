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
  GuiaFiscal,
  RecebimentoParceiroMensal,
  ExtraParceiro,
  PagamentoExtraParceiroMensal,
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
  SenhaPortalEscritorio,
  DadosEscritorio,
  ContratoAssinatura,
  Funcionario,
  AuditLogEntry,
  CrcRegistroInfo,
  CrcUfComunicada,
  CrcAnuidade,
  CrcEleicao,
  CrcDeclaracaoCoaf,
  ScriptDepartamento,
  Script,
  ConteudoPost,
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
  const setGuiasFiscaisFromSupabase = useAppStore((s) => s.setGuiasFiscaisFromSupabase);
  const setRecebimentosParceiroFromSupabase = useAppStore((s) => s.setRecebimentosParceiroFromSupabase);
  const setExtrasParceiroFromSupabase = useAppStore((s) => s.setExtrasParceiroFromSupabase);
  const setPagamentosExtrasParceiroFromSupabase = useAppStore((s) => s.setPagamentosExtrasParceiroFromSupabase);
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
  const setSenhasPortaisFromSupabase = useAppStore((s) => s.setSenhasPortaisFromSupabase);
  const setDadosEscritorioFromSupabase = useAppStore((s) => s.setDadosEscritorioFromSupabase);
  const setMetaMensalClientesFromSupabase = useAppStore((s) => s.setMetaMensalClientesFromSupabase);
  const setContratosAssinaturaFromSupabase = useAppStore((s) => s.setContratosAssinaturaFromSupabase);
  const setFuncionariosFromSupabase = useAppStore((s) => s.setFuncionariosFromSupabase);
  const setAuditLogFromSupabase = useAppStore((s) => s.setAuditLogFromSupabase);
  const setCrcRegistroPessoalFromSupabase = useAppStore((s) => s.setCrcRegistroPessoalFromSupabase);
  const setCrcRegistroEmpresaFromSupabase = useAppStore((s) => s.setCrcRegistroEmpresaFromSupabase);
  const setCrcUfsFromSupabase = useAppStore((s) => s.setCrcUfsFromSupabase);
  const setCrcAnuidadesFromSupabase = useAppStore((s) => s.setCrcAnuidadesFromSupabase);
  const setCrcEleicoesFromSupabase = useAppStore((s) => s.setCrcEleicoesFromSupabase);
  const setCrcDeclaracoesCoafFromSupabase = useAppStore((s) => s.setCrcDeclaracoesCoafFromSupabase);
  const setScriptsDepartamentosFromSupabase = useAppStore((s) => s.setScriptsDepartamentosFromSupabase);
  const setScriptsFromSupabase = useAppStore((s) => s.setScriptsFromSupabase);
  const setConteudoPostsFromSupabase = useAppStore((s) => s.setConteudoPostsFromSupabase);
  const applyNotificationsLidas = useAppStore((s) => s.applyNotificationsLidas);
  const setFinanceiroCarregado = useAppStore((s) => s.setFinanceiroCarregado);

  useEffect(() => {
    if (!active) return;
    const supabase = createClient();
    let cancelled = false;
    let reloadTimer: ReturnType<typeof setTimeout> | undefined;

    async function loadAll() {
      // Busca sem paginar vinha limitada às primeiras ~1000 linhas (limite
      // padrão do Supabase por consulta) — com a tabela já passando disso,
      // tipos menores e mais recentes (como "tasks") ficavam de fora da
      // resposta inteiros, sem nenhum erro, dando a impressão de terem
      // sumido. Agora busca em páginas até não sobrar mais nada.
      const PAGE_SIZE = 1000;
      const rows: DadosFinanceirosRow[] = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await supabase
          .from("dados_financeiros")
          .select("tipo, data")
          .range(from, from + PAGE_SIZE - 1);
        if (cancelled) return;
        if (error) {
          console.error("Erro ao carregar dados do Eleven Hub:", error.message);
          setFinanceiroCarregado();
          return;
        }
        const pagina = (data ?? []) as DadosFinanceirosRow[];
        rows.push(...pagina);
        if (pagina.length < PAGE_SIZE) break;
      }
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
      setGuiasFiscaisFromSupabase(porTipo<GuiaFiscal>("guiasFiscais"));
      setRecebimentosParceiroFromSupabase(porTipo<RecebimentoParceiroMensal>("recebimentosParceiro"));
      setExtrasParceiroFromSupabase(porTipo<ExtraParceiro>("extrasParceiro"));
      setPagamentosExtrasParceiroFromSupabase(porTipo<PagamentoExtraParceiroMensal>("pagamentosExtrasParceiro"));
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
      setSenhasPortaisFromSupabase(porTipo<SenhaPortalEscritorio>("senhasPortais"));
      setContratosAssinaturaFromSupabase(porTipo<ContratoAssinatura>("contratosAssinatura"));
      setFuncionariosFromSupabase(porTipo<Funcionario>("funcionarios"));
      setAuditLogFromSupabase(porTipo<AuditLogEntry>("auditLog"));
      setCrcUfsFromSupabase(porTipo<CrcUfComunicada>("crcUfs"));
      setCrcAnuidadesFromSupabase(porTipo<CrcAnuidade>("crcAnuidades"));
      setCrcEleicoesFromSupabase(porTipo<CrcEleicao>("crcEleicoes"));
      setCrcDeclaracoesCoafFromSupabase(porTipo<CrcDeclaracaoCoaf>("crcDeclaracoesCoaf"));
      setScriptsDepartamentosFromSupabase(porTipo<ScriptDepartamento>("scriptsDepartamentos"));
      setScriptsFromSupabase(porTipo<Script>("scripts"));
      setConteudoPostsFromSupabase(porTipo<ConteudoPost>("conteudoPosts"));

      const crcRegistroPessoal = itemUnico<CrcRegistroInfo>("crcRegistroPessoal");
      if (crcRegistroPessoal) setCrcRegistroPessoalFromSupabase(crcRegistroPessoal);
      const crcRegistroEmpresa = itemUnico<CrcRegistroInfo>("crcRegistroEmpresa");
      if (crcRegistroEmpresa) setCrcRegistroEmpresaFromSupabase(crcRegistroEmpresa);

      const dadosEscritorio = itemUnico<DadosEscritorio>("dadosEscritorio");
      if (dadosEscritorio) setDadosEscritorioFromSupabase(dadosEscritorio);
      const meta = itemUnico<{ valor: number }>("metaMensalClientes");
      if (meta) setMetaMensalClientesFromSupabase(meta.valor);

      const idsLidos = porTipo<{ id: string }>("notificacoesLidas").map((n) => n.id);
      if (idsLidos.length > 0) applyNotificationsLidas(idsLidos);

      setFinanceiroCarregado();
    }

    void loadAll();

    // Marcar várias caixinhas rapidamente (ex: checklist de onboarding)
    // dispara uma gravação por clique, e cada gravação dispara esse evento —
    // recarregar a tabela inteira (que já passa de 1000 linhas, então leva um
    // tempinho) a cada clique deixava recargas se sobrepondo: uma recarga que
    // começou antes do clique mais recente terminar de salvar podia
    // "pisar" por cima dele com um estado mais antigo, parecendo que outra
    // caixinha desmarcou sozinha. Espera uma pausa nos eventos antes de
    // recarregar, pra pegar sempre o estado final de verdade.
    function scheduleReload() {
      if (reloadTimer) clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => void loadAll(), 600);
    }

    const channel = supabase
      .channel("dados-financeiros-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "dados_financeiros" }, scheduleReload)
      .subscribe();

    return () => {
      cancelled = true;
      if (reloadTimer) clearTimeout(reloadTimer);
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
    setGuiasFiscaisFromSupabase,
    setRecebimentosParceiroFromSupabase,
    setExtrasParceiroFromSupabase,
    setPagamentosExtrasParceiroFromSupabase,
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
    setSenhasPortaisFromSupabase,
    setDadosEscritorioFromSupabase,
    setMetaMensalClientesFromSupabase,
    setContratosAssinaturaFromSupabase,
    setFuncionariosFromSupabase,
    setAuditLogFromSupabase,
    setCrcRegistroPessoalFromSupabase,
    setCrcRegistroEmpresaFromSupabase,
    setCrcUfsFromSupabase,
    setCrcAnuidadesFromSupabase,
    setCrcEleicoesFromSupabase,
    setCrcDeclaracoesCoafFromSupabase,
    setScriptsDepartamentosFromSupabase,
    setScriptsFromSupabase,
    setConteudoPostsFromSupabase,
    applyNotificationsLidas,
    setFinanceiroCarregado,
  ]);
}
