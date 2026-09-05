"use client";

import { useMemo, useState } from "react";
import { TrendingUp, Receipt, Percent, Search, FileSearch, FileUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { setorAtendidoPelaEleven } from "@/lib/types";
import { extractPdfText } from "@/lib/pdf-text";
import { extractPgdasValores } from "@/lib/pgdas-extract";
import { onlyDigits } from "@/lib/cnpj";
import { cn, formatCurrency } from "@/lib/utils";

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

  const [busca, setBusca] = useState("");
  const [year, setYear] = useState(() => {
    const current = new Date().getFullYear().toString();
    return YEARS.includes(current) ? current : YEARS[0];
  });
  const [mes, setMes] = useState<string>(() => String(new Date().getMonth() + 1).padStart(2, "0"));
  const [lendoPgdas, setLendoPgdas] = useState(false);
  const [pgdasErro, setPgdasErro] = useState<string | null>(null);
  const [pgdasPreview, setPgdasPreview] = useState<{
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

  function confirmarPgdas() {
    if (!pgdasPreview || !pgdasPreview.clienteId) return;
    updateFaturamentoMensal(pgdasPreview.clienteId, pgdasPreview.competencia, {
      faturamento: pgdasPreview.faturamento,
      imposto: pgdasPreview.imposto,
    });
    setYear(pgdasPreview.competencia.slice(0, 4));
    setMes(pgdasPreview.competencia.slice(5, 7));
    setPgdasPreview(null);
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

  return (
    <div>
      <PageHeader
        title="Faturamento"
        description="Faturamento e imposto pago por cliente em cada competência — lançado a partir da guia do mês (PGDAS, DAS etc). Alimenta o dashboard que o cliente vê no Portal."
      />

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
                <Button type="button" size="sm" disabled={!pgdasPreview.clienteId} onClick={confirmarPgdas}>Salvar lançamento</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setPgdasPreview(null)}>Cancelar</Button>
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
                  </TableRow>
                );
              })}
              {filtradas.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sand-400">Nenhum cliente encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
