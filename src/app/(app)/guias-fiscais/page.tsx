"use client";

import { useMemo, useState } from "react";
import { ScrollText, Search, FileSearch, FileUp, Eye, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { setorAtendidoPelaEleven, TIPOS_GUIA_FISCAL, type TipoGuiaFiscal, type GuiaFiscal } from "@/lib/types";
import { extractPdfText } from "@/lib/pdf-text";
import { extractGuiaFiscal } from "@/lib/guia-fiscal-extract";
import { uploadDocumento } from "@/lib/upload-documento";
import { onlyDigits } from "@/lib/cnpj";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

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

export default function GuiasFiscaisPage() {
  const clients = useAppStore((s) => s.clients);
  const guiasFiscais = useAppStore((s) => s.guiasFiscais);
  const addGuiaFiscal = useAppStore((s) => s.addGuiaFiscal);
  const updateGuiaFiscal = useAppStore((s) => s.updateGuiaFiscal);
  const deleteGuiaFiscal = useAppStore((s) => s.deleteGuiaFiscal);
  const { userId } = useAuthStore();

  const [busca, setBusca] = useState("");
  const [year, setYear] = useState(() => {
    const current = new Date().getFullYear().toString();
    return YEARS.includes(current) ? current : YEARS[0];
  });
  const [mes, setMes] = useState<string>(() => String(new Date().getMonth() + 1).padStart(2, "0"));

  const [lendoGuia, setLendoGuia] = useState(false);
  const [salvandoGuia, setSalvandoGuia] = useState(false);
  const [guiaErro, setGuiaErro] = useState<string | null>(null);
  const [guiaPreview, setGuiaPreview] = useState<{
    file: File;
    clienteId: string;
    tipo: TipoGuiaFiscal;
    competencia: string;
    vencimento: string;
    valor: number;
    cnpjNaoEncontrado?: string;
  } | null>(null);

  const clientesAtendidos = useMemo(
    () =>
      clients.filter(
        (c) => (c.status === "Ativo" || c.status === "Com pendência" || c.status === "Onboarding") && setorAtendidoPelaEleven(c, "fiscal")
      ),
    [clients]
  );

  const competencia = `${year}-${mes}`;

  async function lerGuia(file: File) {
    setLendoGuia(true);
    setGuiaErro(null);
    setGuiaPreview(null);
    try {
      const texto = await extractPdfText(file);
      const extraido = extractGuiaFiscal(texto);
      if (!extraido.vencimento || extraido.valor === undefined) {
        setGuiaErro(
          "Não consegui ler os dados dessa guia automaticamente. Confira se é um PDF digital (não digitalizado/foto) e lance manualmente."
        );
        return;
      }
      const cliente = extraido.cnpj
        ? clientesAtendidos.find((c) => onlyDigits(c.dados.cnpj) === onlyDigits(extraido.cnpj!))
        : undefined;
      setGuiaPreview({
        file,
        clienteId: cliente?.id ?? "",
        tipo: "DARF",
        competencia: extraido.competencia ?? competencia,
        vencimento: extraido.vencimento,
        valor: extraido.valor,
        cnpjNaoEncontrado: !cliente ? extraido.cnpj : undefined,
      });
    } catch {
      setGuiaErro("Não consegui ler esse PDF. Confira se o arquivo não está corrompido.");
    } finally {
      setLendoGuia(false);
    }
  }

  async function confirmarGuia() {
    if (!guiaPreview || !guiaPreview.clienteId) return;
    setSalvandoGuia(true);
    try {
      const cliente = clientesAtendidos.find((c) => c.id === guiaPreview.clienteId);
      let arquivoUrl: string | undefined;
      if (cliente) {
        try {
          const documento = await uploadDocumento({
            file: guiaPreview.file,
            clienteId: cliente.id,
            clienteNome: cliente.dados.nomeFantasia ?? cliente.dados.razaoSocial,
            categoria: "Guias",
            responsavelId: userId ?? undefined,
          });
          arquivoUrl = documento.url;
        } catch (err) {
          setGuiaErro(
            `Guia salva, mas não consegui guardar o PDF no Drive: ${err instanceof Error ? err.message : "erro desconhecido"}`
          );
        }
      }
      const guia: GuiaFiscal = {
        id: `guia-${Date.now()}`,
        clienteId: guiaPreview.clienteId,
        tipo: guiaPreview.tipo,
        competencia: guiaPreview.competencia,
        vencimento: guiaPreview.vencimento,
        valorOriginal: guiaPreview.valor,
        arquivoUrl,
      };
      addGuiaFiscal(guia);
      setYear(guiaPreview.competencia.slice(0, 4));
      setMes(guiaPreview.competencia.slice(5, 7));
      setGuiaPreview(null);
    } finally {
      setSalvandoGuia(false);
    }
  }

  function handleDelete(guia: GuiaFiscal, clienteNome: string) {
    if (confirm(`Excluir a guia ${guia.tipo} de ${clienteNome} (${guia.competencia})?`)) {
      deleteGuiaFiscal(guia.id);
    }
  }

  const linhas = useMemo(() => {
    return guiasFiscais
      .filter((g) => g.competencia === competencia)
      .map((g) => ({ guia: g, cliente: clients.find((c) => c.id === g.clienteId) }))
      .filter(({ cliente }) => {
        if (!busca.trim()) return true;
        const nome = cliente?.dados.nomeFantasia ?? cliente?.dados.razaoSocial ?? "";
        return nome.toLowerCase().includes(busca.trim().toLowerCase());
      });
  }, [guiasFiscais, clients, competencia, busca]);

  const totalOriginal = linhas.reduce((a, l) => a + l.guia.valorOriginal, 0);
  const totalPendentes = linhas.filter((l) => !l.guia.paga).length;

  return (
    <div>
      <PageHeader
        title="Guias Fiscais"
        description="DARF, GPS e DAS lidos automaticamente do PDF — o cliente vê no Portal e pode recalcular o valor se pagar depois do vencimento (multa de mora)."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileSearch className="size-4 text-wine-600" /> Ler guia automaticamente</CardTitle>
          <p className="mt-1 text-xs text-sand-500">
            Sobe o PDF da guia (DARF, GPS ou DAS) e a gente tenta ler CNPJ, competência, vencimento e valor sozinho — confira antes
            de salvar. Funciona melhor com DARF; GPS e DAS podem precisar de ajuste manual.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-sand-300 bg-sand-50 px-4 py-4 text-center hover:border-wine-400 hover:bg-wine-50">
            <FileUp className="size-4 text-wine-500" />
            <span className="text-xs font-medium text-sand-700">{lendoGuia ? "Lendo PDF..." : "Clique pra selecionar a guia em PDF"}</span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={lendoGuia}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void lerGuia(file);
                e.target.value = "";
              }}
            />
          </label>

          {guiaErro && <p className="text-xs text-status-danger">{guiaErro}</p>}

          {guiaPreview && (
            <div className="space-y-3 rounded-lg border border-sand-200 p-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div>
                  <p className="mb-1 text-[11px] text-sand-500">Cliente</p>
                  <Select
                    value={guiaPreview.clienteId}
                    onValueChange={(v) => setGuiaPreview((p) => (p ? { ...p, clienteId: v } : p))}
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
                  <p className="mb-1 text-[11px] text-sand-500">Tipo</p>
                  <Select value={guiaPreview.tipo} onValueChange={(v) => setGuiaPreview((p) => (p ? { ...p, tipo: v as TipoGuiaFiscal } : p))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_GUIA_FISCAL.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-1 text-[11px] text-sand-500">Competência</p>
                  <Input
                    value={guiaPreview.competencia}
                    onChange={(e) => setGuiaPreview((p) => (p ? { ...p, competencia: e.target.value } : p))}
                    placeholder="YYYY-MM"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11px] text-sand-500">Vencimento</p>
                  <Input
                    type="date"
                    value={guiaPreview.vencimento}
                    onChange={(e) => setGuiaPreview((p) => (p ? { ...p, vencimento: e.target.value } : p))}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11px] text-sand-500">Valor</p>
                  <Input
                    type="number"
                    step="0.01"
                    value={guiaPreview.valor}
                    onChange={(e) => setGuiaPreview((p) => (p ? { ...p, valor: Number(e.target.value) || 0 } : p))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              {guiaPreview.cnpjNaoEncontrado && (
                <p className="text-xs text-status-warning">
                  CNPJ {guiaPreview.cnpjNaoEncontrado} não bate com nenhum cliente cadastrado — selecione manualmente acima.
                </p>
              )}
              <div className="flex gap-2">
                <Button type="button" size="sm" disabled={!guiaPreview.clienteId || salvandoGuia} onClick={() => void confirmarGuia()}>
                  {salvandoGuia ? <><Loader2 className="size-3.5 animate-spin" /> Salvando...</> : "Salvar guia"}
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={salvandoGuia} onClick={() => setGuiaPreview(null)}>Cancelar</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Guias no período" value={linhas.length} icon={ScrollText} tone="wine" />
        <MetricCard label="Valor original total" value={formatCurrency(totalOriginal)} icon={ScrollText} tone="success" />
        <MetricCard label="Pendentes de pagamento" value={totalPendentes} icon={ScrollText} tone="warning" />
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
          <CardTitle>Guias de {MESES.find((m) => m.value === mes)?.label}/{year}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Table className="min-w-[960px]">
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="w-20">Tipo</TableHead>
                <TableHead className="w-32">Vencimento</TableHead>
                <TableHead className="w-32">Valor original</TableHead>
                <TableHead className="w-24 text-center">Paga</TableHead>
                <TableHead className="w-10" />
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map(({ guia, cliente }) => {
                const clienteNome = cliente?.dados.nomeFantasia ?? cliente?.dados.razaoSocial ?? "—";
                return (
                  <TableRow key={guia.id}>
                    <TableCell className="font-medium">{clienteNome}</TableCell>
                    <TableCell>{guia.tipo}</TableCell>
                    <TableCell>{formatDate(guia.vencimento)}</TableCell>
                    <TableCell>{formatCurrency(guia.valorOriginal)}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={!!guia.paga}
                        onCheckedChange={(v) =>
                          updateGuiaFiscal(guia.id, { paga: !!v, dataPagamento: v ? new Date().toISOString().slice(0, 10) : undefined })
                        }
                        className="mx-auto"
                      />
                    </TableCell>
                    <TableCell>
                      {guia.arquivoUrl ? (
                        <a
                          href={guia.arquivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver guia"
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
                        onClick={() => handleDelete(guia, clienteNome)}
                        title="Excluir guia"
                        className="rounded-md p-1.5 text-sand-400 transition-colors hover:bg-status-danger/10 hover:text-status-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {linhas.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-sand-400">Nenhuma guia lançada nessa competência.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
