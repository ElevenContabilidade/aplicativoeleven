"use client";

import { useMemo, useState } from "react";
import {
  TrendingUp,
  Receipt,
  Percent,
  Search,
  FileSearch,
  FileUp,
  Eye,
  Trash2,
  Loader2,
  FileText,
  Printer,
  MessageCircle,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { setorAtendidoPelaEleven } from "@/lib/types";
import { extractPdfText } from "@/lib/pdf-text";
import { extractPgdasValores } from "@/lib/pgdas-extract";
import { uploadDocumento } from "@/lib/upload-documento";
import { onlyDigits } from "@/lib/cnpj";
import { cn, formatCurrency } from "@/lib/utils";

const WINE = "#5C1420";
const GOLD = "#B4791F";
const SUBLIMITE_ANUAL = 3_600_000;
const ALERTA_SUBLIMITE = SUBLIMITE_ANUAL * 0.8;

const YEARS = Array.from({ length: 2034 - 2026 + 1 }, (_, i) => String(2026 + i));
const MESES = [
  { value: "01", label: "Jan" }, { value: "02", label: "Fev" }, { value: "03", label: "Mar" },
  { value: "04", label: "Abr" }, { value: "05", label: "Mai" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Ago" }, { value: "09", label: "Set" },
  { value: "10", label: "Out" }, { value: "11", label: "Nov" }, { value: "12", label: "Dez" },
];

function PeriodChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
        active ? "border-wine-600 bg-wine-700 text-cream-50" : "border-sand-300 bg-white text-sand-600 hover:bg-sand-100"
      )}
    >
      {label}
    </button>
  );
}

export default function FaturamentoPage() {
  const clients = useAppStore((s) => s.clients);
  const faturamentoMensal = useAppStore((s) => s.faturamentoMensal);
  const updateFaturamentoMensal = useAppStore((s) => s.updateFaturamentoMensal);
  const deleteFaturamentoMensal = useAppStore((s) => s.deleteFaturamentoMensal);
  const { userId } = useAuthStore();

  const [busca, setBusca] = useState("");
  const [year, setYear] = useState(() => {
    const current = new Date().getFullYear().toString();
    return YEARS.includes(current) ? current : YEARS[0];
  });
  const [mes, setMes] = useState<string>(() => String(new Date().getMonth() + 1).padStart(2, "0"));
  const [lendoPgdas, setLendoPgdas] = useState(false);
  const [salvandoPgdas, setSalvandoPgdas] = useState(false);
  const [pgdasErro, setPgdasErro] = useState<string | null>(null);
  const [pgdasPreview, setPgdasPreview] = useState<{
    file: File;
    clienteId: string;
    competencia: string;
    faturamento: number;
    imposto: number;
    cnpjNaoEncontrado?: string;
  } | null>(null);

  const clientesAtendidos = useMemo(
    () =>
      clients.filter(
        (c) => (c.status === "Ativo" || c.status === "Com pendência" || c.status === "Onboarding") && setorAtendidoPelaEleven(c, "fiscal")
      ),
    [clients]
  );

  async function lerPgdas(file: File) {
    setLendoPgdas(true);
    setPgdasErro(null);
    setPgdasPreview(null);
    try {
      const texto = await extractPdfText(file);
      const extraido = extractPgdasValores(texto);
      if (!extraido.competencia || extraido.faturamento === undefined || extraido.imposto === undefined) {
        setPgdasErro(
          "Não consegui ler os valores desse PDF automaticamente. Confira se é um PGDAS-D digital (não digitalizado/foto) e lance manualmente na tabela abaixo."
        );
        return;
      }
      const cliente = extraido.cnpj
        ? clientesAtendidos.find((c) => onlyDigits(c.dados.cnpj) === onlyDigits(extraido.cnpj!))
        : undefined;
      setPgdasPreview({
        file,
        clienteId: cliente?.id ?? "",
        competencia: extraido.competencia,
        faturamento: extraido.faturamento,
        imposto: extraido.imposto,
        cnpjNaoEncontrado: !cliente ? extraido.cnpj : undefined,
      });
    } catch {
      setPgdasErro("Não consegui ler esse PDF. Confira se o arquivo não está corrompido.");
    } finally {
      setLendoPgdas(false);
    }
  }

  async function confirmarPgdas() {
    if (!pgdasPreview || !pgdasPreview.clienteId) return;
    setSalvandoPgdas(true);
    try {
      const cliente = clientesAtendidos.find((c) => c.id === pgdasPreview.clienteId);
      let pgdasUrl: string | undefined;
      if (cliente) {
        try {
          const documento = await uploadDocumento({
            file: pgdasPreview.file,
            clienteId: cliente.id,
            clienteNome: cliente.dados.nomeFantasia ?? cliente.dados.razaoSocial,
            categoria: "Guias",
            responsavelId: userId ?? undefined,
          });
          pgdasUrl = documento.url;
        } catch (err) {
          setPgdasErro(
            `Lançamento salvo, mas não consegui guardar o PDF no Drive: ${err instanceof Error ? err.message : "erro desconhecido"}`
          );
        }
      }
      updateFaturamentoMensal(pgdasPreview.clienteId, pgdasPreview.competencia, {
        faturamento: pgdasPreview.faturamento,
        imposto: pgdasPreview.imposto,
        pgdasUrl,
      });
      setYear(pgdasPreview.competencia.slice(0, 4));
      setMes(pgdasPreview.competencia.slice(5, 7));
      setPgdasPreview(null);
    } finally {
      setSalvandoPgdas(false);
    }
  }

  function handleDeleteFaturamento(clienteId: string, clienteNome: string) {
    if (confirm(`Excluir o lançamento de faturamento de ${clienteNome} em ${competencia}?`)) {
      deleteFaturamentoMensal(clienteId, competencia);
    }
  }

  const competencia = `${year}-${mes}`;

  const linhas = useMemo(() => {
    const entryMap = new Map(faturamentoMensal.map((f) => [`${f.clienteId}__${f.competencia}`, f]));
    return clientesAtendidos
      .filter((c) => !c.financeiro.inicioContrato || competencia >= c.financeiro.inicioContrato.slice(0, 7))
      .map((cliente) => {
        const entry = entryMap.get(`${cliente.id}__${competencia}`);
        return {
          cliente,
          faturamento: entry?.faturamento ?? 0,
          imposto: entry?.imposto ?? 0,
          observacao: entry?.observacao ?? "",
          pgdasUrl: entry?.pgdasUrl,
        };
      });
  }, [clientesAtendidos, faturamentoMensal, competencia]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return linhas;
    return linhas.filter((l) => (l.cliente.dados.nomeFantasia ?? l.cliente.dados.razaoSocial).toLowerCase().includes(q));
  }, [linhas, busca]);

  const totalFaturamento = filtradas.reduce((a, l) => a + l.faturamento, 0);
  const totalImposto = filtradas.reduce((a, l) => a + l.imposto, 0);
  const cargaMedia = totalFaturamento > 0 ? (totalImposto / totalFaturamento) * 100 : 0;

  // ---------- Relatório mensal (histórico fiscal por cliente) ----------
  const [aba, setAba] = useState<"lancamentos" | "relatorio">("lancamentos");
  const [relClienteId, setRelClienteId] = useState("");
  const [relCompetencia, setRelCompetencia] = useState("");
  const [resumoCopiado, setResumoCopiado] = useState(false);

  // Sem cliente escolhido ainda, cai no primeiro da lista — sem useEffect
  // pra evitar o set-state-em-efeito só pra aplicar um valor padrão.
  const relClienteIdEfetivo = relClienteId || clientesAtendidos[0]?.id || "";
  const relCliente = clientesAtendidos.find((c) => c.id === relClienteIdEfetivo);

  const historicoCliente = useMemo(
    () =>
      faturamentoMensal
        .filter((f) => f.clienteId === relClienteIdEfetivo && (f.faturamento ?? 0) > 0)
        .sort((a, b) => a.competencia.localeCompare(b.competencia)),
    [faturamentoMensal, relClienteIdEfetivo]
  );

  // Mesma ideia: sem competência escolhida (ou escolhida num cliente
  // diferente), cai na mais recente do histórico desse cliente.
  const relCompetenciaEfetiva = historicoCliente.some((h) => h.competencia === relCompetencia)
    ? relCompetencia
    : (historicoCliente[historicoCliente.length - 1]?.competencia ?? "");

  const idxAtual = historicoCliente.findIndex((h) => h.competencia === relCompetenciaEfetiva);
  const entradaAtual = idxAtual >= 0 ? historicoCliente[idxAtual] : undefined;
  const entradaAnterior = idxAtual > 0 ? historicoCliente[idxAtual - 1] : undefined;

  const cargaAtual = entradaAtual?.faturamento ? ((entradaAtual.imposto ?? 0) / entradaAtual.faturamento) * 100 : 0;
  const cargaAnterior =
    entradaAnterior?.faturamento !== undefined && entradaAnterior.faturamento > 0
      ? ((entradaAnterior.imposto ?? 0) / entradaAnterior.faturamento) * 100
      : undefined;

  const ultimos13 = idxAtual >= 0 ? historicoCliente.slice(Math.max(0, idxAtual - 12), idxAtual + 1) : [];
  const mediaUltimos12 =
    ultimos13.length > 1
      ? ultimos13.slice(0, -1).reduce((a, h) => a + (h.faturamento ?? 0), 0) / (ultimos13.length - 1)
      : undefined;

  const anoRelatorio = relCompetenciaEfetiva.slice(0, 4);
  const rbaAno = historicoCliente
    .filter((h) => h.competencia.slice(0, 4) === anoRelatorio && h.competencia <= relCompetenciaEfetiva)
    .reduce((a, h) => a + (h.faturamento ?? 0), 0);

  const pontosDeAtencao: string[] = [];
  if (rbaAno > ALERTA_SUBLIMITE) {
    pontosDeAtencao.push(
      `O faturamento acumulado no ano (${formatCurrency(rbaAno)}) se aproxima do sublimite de ${formatCurrency(SUBLIMITE_ANUAL)} pra recolhimento de ICMS/ISS no DAS.`
    );
  }
  if (cargaAnterior !== undefined && cargaAtual - cargaAnterior >= 10) {
    pontosDeAtencao.push(
      `O percentual de imposto sobre o faturamento subiu de ${cargaAnterior.toFixed(1)}% pra ${cargaAtual.toFixed(1)}% em relação ao mês anterior.`
    );
  }

  function competenciaLabel(comp: string) {
    const [ano, mesComp] = comp.split("-");
    return `${MESES.find((m) => m.value === mesComp)?.label ?? mesComp}/${ano}`;
  }

  function montarResumoTexto(): string {
    if (!relCliente || !entradaAtual) return "";
    const nome = relCliente.dados.nomeFantasia ?? relCliente.dados.razaoSocial;
    const partes = [
      `*Relatório fiscal mensal — ${nome}*`,
      `Competência: ${competenciaLabel(relCompetenciaEfetiva)}`,
      `Faturamento: ${formatCurrency(entradaAtual.faturamento ?? 0)}`,
      `Imposto (DAS): ${formatCurrency(entradaAtual.imposto ?? 0)}`,
      `Carga tributária: ${cargaAtual.toFixed(1)}%`,
    ];
    if (entradaAtual.observacao?.trim()) partes.push("", entradaAtual.observacao.trim());
    if (pontosDeAtencao.length > 0) partes.push("", "Pontos de atenção:", ...pontosDeAtencao.map((p) => `• ${p}`));
    return partes.join("\n");
  }

  function telefoneCliente(cliente: NonNullable<typeof relCliente>): string {
    const socioComFone = cliente.socios.find((s) => s.administrador && s.telefone) ?? cliente.socios.find((s) => s.telefone);
    return socioComFone?.telefone ?? cliente.contatos.find((c) => c.telefone)?.telefone ?? "";
  }

  function linkWhatsappRelatorio(): string {
    const numero = onlyDigits(relCliente ? telefoneCliente(relCliente) : "");
    const prefixado = numero.length >= 10 && !numero.startsWith("55") ? `55${numero}` : numero;
    return `https://wa.me/${prefixado}?text=${encodeURIComponent(montarResumoTexto())}`;
  }

  async function copiarResumoRelatorio() {
    try {
      await navigator.clipboard.writeText(montarResumoTexto());
      setResumoCopiado(true);
      setTimeout(() => setResumoCopiado(false), 1500);
    } catch {
      alert("Não foi possível copiar automaticamente — copie o resumo manualmente.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Faturamento"
        description="Faturamento e imposto pago por cliente em cada competência — lançado a partir da guia do mês (PGDAS, DAS etc). Alimenta o dashboard que o cliente vê no Portal."
      />

      <div className="mb-6 flex flex-wrap gap-1.5 print:hidden">
        <PeriodChip label="Lançamentos" active={aba === "lancamentos"} onClick={() => setAba("lancamentos")} />
        <PeriodChip label="Relatório mensal" active={aba === "relatorio"} onClick={() => setAba("relatorio")} />
      </div>

      {aba === "lancamentos" && (
      <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileSearch className="size-4 text-wine-600" /> Ler PGDAS automaticamente</CardTitle>
          <p className="mt-1 text-xs text-sand-500">
            Sobe o PGDAS-D em PDF e a gente tenta ler competência, faturamento e imposto sozinho — confira os valores antes de salvar.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-sand-300 bg-sand-50 px-4 py-4 text-center hover:border-wine-400 hover:bg-wine-50">
            <FileUp className="size-4 text-wine-500" />
            <span className="text-xs font-medium text-sand-700">{lendoPgdas ? "Lendo PDF..." : "Clique pra selecionar o PGDAS-D em PDF"}</span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={lendoPgdas}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void lerPgdas(file);
                e.target.value = "";
              }}
            />
          </label>

          {pgdasErro && <p className="text-xs text-status-danger">{pgdasErro}</p>}

          {pgdasPreview && (
            <div className="space-y-3 rounded-lg border border-sand-200 p-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="mb-1 text-[11px] text-sand-500">Cliente</p>
                  <Select
                    value={pgdasPreview.clienteId}
                    onValueChange={(v) => setPgdasPreview((p) => (p ? { ...p, clienteId: v } : p))}
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                    <SelectContent>
                      {clientesAtendidos.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.dados.nomeFantasia ?? c.dados.razaoSocial}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-1 text-[11px] text-sand-500">Competência</p>
                  <p className="mt-1.5 text-sm font-medium text-sand-900">{pgdasPreview.competencia}</p>
                </div>
                <div>
                  <p className="mb-1 text-[11px] text-sand-500">Faturamento</p>
                  <Input
                    type="number"
                    step="0.01"
                    value={pgdasPreview.faturamento}
                    onChange={(e) => setPgdasPreview((p) => (p ? { ...p, faturamento: Number(e.target.value) || 0 } : p))}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11px] text-sand-500">Imposto pago</p>
                  <Input
                    type="number"
                    step="0.01"
                    value={pgdasPreview.imposto}
                    onChange={(e) => setPgdasPreview((p) => (p ? { ...p, imposto: Number(e.target.value) || 0 } : p))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              {pgdasPreview.cnpjNaoEncontrado && (
                <p className="text-xs text-status-warning">
                  CNPJ {pgdasPreview.cnpjNaoEncontrado} não bate com nenhum cliente cadastrado — selecione manualmente acima.
                </p>
              )}
              <div className="flex gap-2">
                <Button type="button" size="sm" disabled={!pgdasPreview.clienteId || salvandoPgdas} onClick={() => void confirmarPgdas()}>
                  {salvandoPgdas ? <><Loader2 className="size-3.5 animate-spin" /> Salvando...</> : "Salvar lançamento"}
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={salvandoPgdas} onClick={() => setPgdasPreview(null)}>Cancelar</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Faturamento no período" value={formatCurrency(totalFaturamento)} icon={TrendingUp} tone="wine" />
        <MetricCard label="Imposto no período" value={formatCurrency(totalImposto)} icon={Receipt} tone="warning" />
        <MetricCard label="Carga tributária média" value={`${cargaMedia.toFixed(1)}%`} icon={Percent} tone="success" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Filtrar por cliente" className="pl-8" />
        </div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {MESES.map((m) => (
          <PeriodChip key={m.value} label={m.label} active={mes === m.value} onClick={() => setMes(m.value)} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faturamento de {MESES.find((m) => m.value === mes)?.label}/{year}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="w-40">Faturamento</TableHead>
                <TableHead className="w-40">Imposto pago</TableHead>
                <TableHead className="w-28">Carga tributária</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead className="w-10" />
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((l) => {
                const carga = l.faturamento > 0 ? (l.imposto / l.faturamento) * 100 : 0;
                return (
                  <TableRow key={l.cliente.id}>
                    <TableCell className="font-medium">{l.cliente.dados.nomeFantasia ?? l.cliente.dados.razaoSocial}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={l.faturamento || ""}
                        onChange={(e) => updateFaturamentoMensal(l.cliente.id, competencia, { faturamento: Number(e.target.value) || 0 })}
                        className="h-8 w-32 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={l.imposto || ""}
                        onChange={(e) => updateFaturamentoMensal(l.cliente.id, competencia, { imposto: Number(e.target.value) || 0 })}
                        className="h-8 w-32 text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-sand-600">{l.faturamento > 0 ? `${carga.toFixed(1)}%` : "—"}</TableCell>
                    <TableCell>
                      <Input
                        value={l.observacao}
                        onChange={(e) => updateFaturamentoMensal(l.cliente.id, competencia, { observacao: e.target.value })}
                        placeholder="Ex: número do PGDAS, ajuste, etc."
                        className="h-8 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      {l.pgdasUrl ? (
                        <a
                          href={l.pgdasUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver PGDAS"
                          className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-wine-700"
                        >
                          <Eye className="size-3.5" />
                        </a>
                      ) : (
                        <span title="Nenhum PDF anexado" className="flex size-7 items-center justify-center text-sand-200">
                          <Eye className="size-3.5" />
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleDeleteFaturamento(l.cliente.id, l.cliente.dados.nomeFantasia ?? l.cliente.dados.razaoSocial)}
                        title="Excluir lançamento"
                        className="rounded-md p-1.5 text-sand-400 transition-colors hover:bg-status-danger/10 hover:text-status-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtradas.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-sand-400">Nenhum cliente encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </>
      )}

      {aba === "relatorio" && (
        <div className="space-y-4">
          <Card className="print:hidden">
            <CardContent className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[11px] text-sand-500">Empresa</p>
                <Select value={relClienteIdEfetivo} onValueChange={setRelClienteId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientesAtendidos.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.dados.nomeFantasia ?? c.dados.razaoSocial}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="mb-1 text-[11px] text-sand-500">Competência do relatório</p>
                <Select value={relCompetenciaEfetiva} onValueChange={setRelCompetencia} disabled={historicoCliente.length === 0}>
                  <SelectTrigger><SelectValue placeholder={historicoCliente.length === 0 ? "Sem faturamento lançado" : "Selecione"} /></SelectTrigger>
                  <SelectContent>
                    {[...historicoCliente].reverse().map((h) => (
                      <SelectItem key={h.competencia} value={h.competencia}>{competenciaLabel(h.competencia)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {!relCliente || !entradaAtual ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-sand-400">
                {clientesAtendidos.length === 0
                  ? "Nenhum cliente atendido pelo Fiscal."
                  : "Esse cliente ainda não tem faturamento lançado — lance na aba \"Lançamentos\" (ou leia um PGDAS) pra ver o relatório aqui."}
              </CardContent>
            </Card>
          ) : (
            <article className="space-y-4 rounded-2xl border border-sand-200 bg-sand-50 p-4 sm:p-6 print:space-y-3 print:border-0 print:bg-white print:p-0">
              <div className="flex flex-col gap-2 border-b border-sand-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-wine-700">
                    <FileText className="size-3.5" /> Relatório fiscal mensal · {relCliente.dados.regimeTributario}
                  </p>
                  <h2 className="font-display text-xl font-semibold text-sand-900">{competenciaLabel(relCompetenciaEfetiva)}</h2>
                  <p className="text-xs text-sand-500">
                    {relCliente.dados.nomeFantasia ?? relCliente.dados.razaoSocial} · CNPJ {relCliente.dados.cnpj} ·{" "}
                    {relCliente.dados.municipio}/{relCliente.dados.estado} · Emitido em {new Date().toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 print:hidden">
                  <Button type="button" size="sm" variant="outline" onClick={() => window.print()}>
                    <Printer className="size-3.5" /> Imprimir / salvar PDF
                  </Button>
                  <a href={linkWhatsappRelatorio()} target="_blank" rel="noopener noreferrer">
                    <Button type="button" size="sm" className="bg-status-success text-white hover:bg-status-success/90">
                      <MessageCircle className="size-3.5" /> Enviar resumo no WhatsApp
                    </Button>
                  </a>
                  <Button type="button" size="sm" variant="outline" onClick={() => void copiarResumoRelatorio()}>
                    {resumoCopiado ? <Check className="size-3.5 text-status-success" /> : <Copy className="size-3.5" />}
                    {resumoCopiado ? "Copiado" : "Copiar resumo"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricCard label="Faturamento do mês" value={formatCurrency(entradaAtual.faturamento ?? 0)} icon={TrendingUp} tone="wine" />
                <MetricCard label="Imposto (DAS)" value={formatCurrency(entradaAtual.imposto ?? 0)} icon={Receipt} tone="danger" />
                <MetricCard
                  label="Carga tributária"
                  value={`${cargaAtual.toFixed(1)}%`}
                  icon={Percent}
                  tone="warning"
                  hint={cargaAnterior !== undefined ? `Mês anterior: ${cargaAnterior.toFixed(1)}%` : undefined}
                />
                <MetricCard label="Faturamento acumulado no ano" value={formatCurrency(rbaAno)} icon={FileText} tone="neutral" />
              </div>

              {pontosDeAtencao.length > 0 && (
                <div className="rounded-lg border border-status-warning-bg bg-status-warning-bg/60 p-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-status-warning">
                    <AlertTriangle className="size-3.5" /> Pontos de atenção
                  </p>
                  <ul className="space-y-1">
                    {pontosDeAtencao.map((p) => (
                      <li key={p} className="text-xs text-sand-700">{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-sand-200 bg-white p-4">
                  <p className="mb-2 text-xs font-semibold text-sand-700">Faturamento mensal</p>
                  <div className="h-48 print:h-32">
                    <ResponsiveContainer>
                      <BarChart data={ultimos13.map((h) => ({ mes: competenciaLabel(h.competencia), valor: h.faturamento ?? 0, atual: h.competencia === relCompetenciaEfetiva }))} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D6" vertical={false} />
                        <XAxis dataKey="mes" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={40} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} width={60} />
                        <Tooltip formatter={(v) => formatCurrency(Number(v))} cursor={{ fill: "#F5F0E6" }} />
                        {mediaUltimos12 !== undefined && <ReferenceLine y={mediaUltimos12} stroke={GOLD} strokeDasharray="4 4" />}
                        <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                          {ultimos13.map((h) => (
                            <Cell key={h.competencia} fill={h.competencia === relCompetenciaEfetiva ? GOLD : WINE} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-1 text-[11px] text-sand-500">
                    Em dourado, o mês do relatório.{mediaUltimos12 !== undefined && ` Linha tracejada: média dos meses anteriores (${formatCurrency(mediaUltimos12)}).`}
                  </p>
                </div>

                <div className="rounded-xl border border-sand-200 bg-white p-4">
                  <p className="mb-2 text-xs font-semibold text-sand-700">Imposto pago por mês</p>
                  <div className="h-48 print:h-32">
                    <ResponsiveContainer>
                      <BarChart data={ultimos13.map((h) => ({ mes: competenciaLabel(h.competencia), valor: h.imposto ?? 0 }))} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D6" vertical={false} />
                        <XAxis dataKey="mes" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={40} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} width={60} />
                        <Tooltip formatter={(v) => formatCurrency(Number(v))} cursor={{ fill: "#F5F0E6" }} />
                        <Bar dataKey="valor" fill={WINE} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {ultimos13.length > 1 && (
                <div className="rounded-xl border border-sand-200 bg-white p-4">
                  <p className="mb-2 text-xs font-semibold text-sand-700">Evolução do faturamento</p>
                  <div className="h-48 print:h-32">
                    <ResponsiveContainer>
                      <LineChart data={ultimos13.map((h) => ({ mes: competenciaLabel(h.competencia), valor: h.faturamento ?? 0 }))} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D6" vertical={false} />
                        <XAxis dataKey="mes" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={40} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} width={60} />
                        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                        {mediaUltimos12 !== undefined && <ReferenceLine y={mediaUltimos12} stroke={GOLD} strokeDasharray="4 4" />}
                        <Line type="monotone" dataKey="valor" stroke={WINE} strokeWidth={2.5} dot={{ r: 3, fill: WINE }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-sand-200 bg-white p-4">
                <p className="mb-2 text-xs font-semibold text-sand-700">Histórico de faturamento e impostos</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Competência</TableHead>
                      <TableHead>Faturamento</TableHead>
                      <TableHead>Imposto</TableHead>
                      <TableHead>Carga</TableHead>
                      <TableHead>Observação</TableHead>
                      <TableHead className="w-10 print:hidden" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...historicoCliente].reverse().map((h) => {
                      const carga = h.faturamento ? ((h.imposto ?? 0) / h.faturamento) * 100 : 0;
                      return (
                        <TableRow key={h.competencia} className={cn(h.competencia === relCompetenciaEfetiva && "bg-gold-50")}>
                          <TableCell className="font-medium text-sand-800">{competenciaLabel(h.competencia)}</TableCell>
                          <TableCell>{formatCurrency(h.faturamento ?? 0)}</TableCell>
                          <TableCell>{formatCurrency(h.imposto ?? 0)}</TableCell>
                          <TableCell className="text-sand-500">{h.faturamento ? `${carga.toFixed(1)}%` : "—"}</TableCell>
                          <TableCell className="text-sand-500">{h.observacao || "—"}</TableCell>
                          <TableCell className="print:hidden">
                            {h.pgdasUrl && (
                              <a href={h.pgdasUrl} target="_blank" rel="noopener noreferrer" title="Ver PGDAS" className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-wine-700">
                                <Eye className="size-3.5" />
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <p className="text-[11px] text-sand-400">
                Fonte: lançamentos de faturamento e imposto do próprio Eleven Hub (manuais ou lidos do PGDAS-D). Esse relatório não inclui débitos ou pendências da Situação Fiscal (e-CAC) — confira isso direto no portal da Receita.
              </p>
            </article>
          )}
        </div>
      )}
    </div>
  );
}
