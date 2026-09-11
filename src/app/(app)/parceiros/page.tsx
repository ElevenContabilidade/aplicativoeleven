"use client";

import { useMemo, useState } from "react";
import { Repeat, CircleDollarSign, Wallet, Search, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NovoParceiroDialog } from "@/components/parceiros/novo-parceiro-dialog";
import { useAppStore } from "@/lib/store/app-store";
import type { Client, ExtraParceiro, StatusPagamentoParceiro, TipoPessoaRecebimento } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const YEARS = Array.from({ length: 2034 - 2026 + 1 }, (_, i) => String(2026 + i));
const MESES = [
  { value: "01", label: "Jan" }, { value: "02", label: "Fev" }, { value: "03", label: "Mar" },
  { value: "04", label: "Abr" }, { value: "05", label: "Mai" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Ago" }, { value: "09", label: "Set" },
  { value: "10", label: "Out" }, { value: "11", label: "Nov" }, { value: "12", label: "Dez" },
];

interface Linha {
  cliente: Client;
  competencia: string;
  valor: number;
  status: StatusPagamentoParceiro;
  banco: string;
  tipoPessoa: TipoPessoaRecebimento | "";
}

function inicioContratoLabel(iso: string) {
  if (!iso) return "—";
  const [ano, mes] = iso.split("-");
  if (!ano || !mes) return "—";
  return `${mes}/${ano}`;
}

export default function ParceirosPage() {
  const clients = useAppStore((s) => s.clients);
  const recebimentosParceiro = useAppStore((s) => s.recebimentosParceiro);
  const extrasParceiro = useAppStore((s) => s.extrasParceiro);
  const boletosMensais = useAppStore((s) => s.boletosMensais);
  const recebimentos = useAppStore((s) => s.recebimentos);
  const updateRecebimentoParceiro = useAppStore((s) => s.updateRecebimentoParceiro);
  const addExtraParceiro = useAppStore((s) => s.addExtraParceiro);
  const updateExtraParceiro = useAppStore((s) => s.updateExtraParceiro);
  const deleteExtraParceiro = useAppStore((s) => s.deleteExtraParceiro);

  const bancoOptions = useMemo(() => {
    const usados = [
      ...recebimentosParceiro.map((r) => r.banco),
      ...boletosMensais.map((b) => b.banco),
      ...recebimentos.map((r) => r.banco),
    ].filter((b): b is string => !!b);
    return [...new Set(usados)].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [recebimentosParceiro, boletosMensais, recebimentos]);

  const [busca, setBusca] = useState("");
  const [novoParceiroOpen, setNovoParceiroOpen] = useState(false);
  const [year, setYear] = useState(() => {
    const current = new Date().getFullYear().toString();
    return YEARS.includes(current) ? current : YEARS[0];
  });
  const [mes, setMes] = useState<string>(() => String(new Date().getMonth() + 1).padStart(2, "0"));

  // Antes só entravam clientes de parceiro que já tinham uma mensalidade
  // cadastrada — um parceiro novo, sem valor definido ainda, simplesmente
  // não aparecia aqui e não tinha como cadastrar o valor manualmente. Agora
  // todo cliente marcado como parceiro aparece (com R$ 0,00 até alguém
  // preencher o campo Valor da linha).
  const clientesParceiro = useMemo(() => clients.filter((c) => c.dados.clienteParceiro), [clients]);

  const parceirosExistentes = useMemo(
    () => [...new Set(clients.map((c) => c.dados.nomeParceiro).filter((n): n is string => !!n?.trim()))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [clients]
  );

  const competencias = mes === "anual" ? MESES.map((m) => `${year}-${m.value}`) : [`${year}-${mes}`];

  /** Cliente só entra a partir do mês de início do contrato — contrato
   * começado em 09/2026 não aparece em competências anteriores. */
  const linhas: Linha[] = useMemo(() => {
    const entryMap = new Map(recebimentosParceiro.map((r) => [`${r.clienteId}__${r.competencia}`, r]));
    const list: Linha[] = [];
    for (const cliente of clientesParceiro) {
      const inicio = cliente.financeiro.inicioContrato?.slice(0, 7);
      for (const comp of competencias) {
        if (inicio && comp < inicio) continue;
        const entry = entryMap.get(`${cliente.id}__${comp}`);
        if (entry?.removido) continue;
        list.push({
          cliente,
          competencia: comp,
          valor: entry?.valor ?? cliente.financeiro.valorMensal,
          status: entry?.status ?? "Em aberto",
          banco: entry?.banco ?? "",
          tipoPessoa: entry?.tipoPessoa ?? "",
        });
      }
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientesParceiro, recebimentosParceiro, year, mes]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return linhas;
    return linhas.filter(
      (l) =>
        (l.cliente.dados.nomeFantasia ?? l.cliente.dados.razaoSocial).toLowerCase().includes(q) ||
        (l.cliente.dados.nomeParceiro ?? "").toLowerCase().includes(q)
    );
  }, [linhas, busca]);

  /** Valores extras que um parceiro cobra à parte (ex: um sistema usado só
   * por ele), fora do que vem do cadastro de cada cliente. */
  const extrasFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return extrasParceiro.filter((e) => {
      if (!competencias.includes(e.competencia)) return false;
      if (!q) return true;
      return e.nomeParceiro.toLowerCase().includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extrasParceiro, year, mes, busca]);

  const grupos = useMemo(() => {
    const porParceiro = new Map<string, { linhas: Linha[]; extras: ExtraParceiro[] }>();
    for (const l of filtradas) {
      const nome = l.cliente.dados.nomeParceiro?.trim() || "Sem parceiro definido";
      const grupo = porParceiro.get(nome) ?? { linhas: [], extras: [] };
      grupo.linhas.push(l);
      porParceiro.set(nome, grupo);
    }
    for (const ex of extrasFiltradas) {
      const nome = ex.nomeParceiro.trim() || "Sem parceiro definido";
      const grupo = porParceiro.get(nome) ?? { linhas: [], extras: [] };
      grupo.extras.push(ex);
      porParceiro.set(nome, grupo);
    }
    return [...porParceiro.entries()]
      .map(([parceiro, { linhas, extras }]) => ({
        parceiro,
        linhas: linhas.sort((a, b) => {
          const nomeCompare = (a.cliente.dados.nomeFantasia ?? a.cliente.dados.razaoSocial).localeCompare(
            b.cliente.dados.nomeFantasia ?? b.cliente.dados.razaoSocial,
            "pt-BR"
          );
          return nomeCompare !== 0 ? nomeCompare : a.competencia.localeCompare(b.competencia);
        }),
        extras: extras.sort((a, b) => a.competencia.localeCompare(b.competencia)),
        total: linhas.reduce((sum, l) => sum + l.valor, 0) + extras.reduce((sum, e) => sum + e.valor, 0),
      }))
      .sort((a, b) => a.parceiro.localeCompare(b.parceiro, "pt-BR"));
  }, [filtradas, extrasFiltradas]);

  const mrr = clientesParceiro.reduce((a, c) => a + c.financeiro.valorMensal, 0);
  const totalRecebido =
    filtradas.filter((l) => l.status === "Pago").reduce((a, l) => a + l.valor, 0) +
    extrasFiltradas.filter((e) => e.status === "Pago").reduce((a, e) => a + e.valor, 0);
  const totalEmAberto =
    filtradas.filter((l) => l.status === "Em aberto").reduce((a, l) => a + l.valor, 0) +
    extrasFiltradas.filter((e) => e.status === "Em aberto").reduce((a, e) => a + e.valor, 0);

  function toggleStatus(l: Linha) {
    updateRecebimentoParceiro(l.cliente.id, l.competencia, { status: l.status === "Pago" ? "Em aberto" : "Pago" });
  }

  function handleAddExtra(parceiro: string) {
    return () => {
      const id = `extra-${Date.now()}`;
      addExtraParceiro({
        id,
        nomeParceiro: parceiro,
        competencia: `${year}-${mes}`,
        descricao: "",
        valor: 0,
        status: "Em aberto",
      });
    };
  }

  function handleDeleteExtra(extra: ExtraParceiro) {
    if (confirm(`Excluir o valor extra "${extra.descricao || "sem descrição"}"?`)) deleteExtraParceiro(extra.id);
  }

  return (
    <div>
      <PageHeader
        title="Parceiros"
        description="Recebimentos via PIX das empresas de parceiros que a Eleven atende — não entram na emissão de boletos."
        actions={<Button onClick={() => setNovoParceiroOpen(true)}><Plus className="size-3.5" /> Novo parceiro</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricCard label="MRR" value={formatCurrency(mrr)} icon={Repeat} tone="wine" />
        <MetricCard label="Recebido" value={formatCurrency(totalRecebido)} icon={CircleDollarSign} tone="success" />
        <MetricCard label="Em aberto" value={formatCurrency(totalEmAberto)} icon={Wallet} tone="warning" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Filtrar por empresa ou parceiro" className="pl-8" />
        </div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <PeriodChip label="Anual" active={mes === "anual"} onClick={() => setMes("anual")} />
        {MESES.map((m) => (
          <PeriodChip key={m.value} label={m.label} active={mes === m.value} onClick={() => setMes(m.value)} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Recebimentos de parceiros — {mes === "anual" ? year : `${MESES.find((m) => m.value === mes)?.label}/${year}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa do parceiro</TableHead>
                {mes === "anual" && <TableHead className="w-24">Competência</TableHead>}
                <TableHead className="w-32">Valor</TableHead>
                <TableHead className="w-36">Início do contrato</TableHead>
                <TableHead className="w-36">Banco</TableHead>
                <TableHead className="w-24">Tipo</TableHead>
                <TableHead className="w-32">Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            {grupos.map((g) => (
              <TableBody key={g.parceiro}>
                <TableRow className="bg-wine-50/60 hover:bg-wine-50/60">
                  <TableCell colSpan={mes === "anual" ? 7 : 6} className="py-1.5 text-[11px] font-semibold uppercase tracking-wide text-wine-700">
                    {g.parceiro}
                  </TableCell>
                </TableRow>
                {g.linhas.map((l) => (
                  <TableRow key={`${l.cliente.id}-${l.competencia}`}>
                    <TableCell className="font-medium">{l.cliente.dados.nomeFantasia ?? l.cliente.dados.razaoSocial}</TableCell>
                    {mes === "anual" && (
                      <TableCell className="text-sand-500">{inicioContratoLabel(l.competencia)}</TableCell>
                    )}
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={l.valor}
                        onChange={(e) => updateRecebimentoParceiro(l.cliente.id, l.competencia, { valor: Number(e.target.value) || 0 })}
                        className="h-8 w-28 text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-sand-500">{inicioContratoLabel(l.cliente.financeiro.inicioContrato)}</TableCell>
                    <TableCell>
                      <Input
                        value={l.banco}
                        onChange={(e) => updateRecebimentoParceiro(l.cliente.id, l.competencia, { banco: e.target.value })}
                        placeholder="Em qual banco"
                        list="parceiros-bancos"
                        className="h-8 w-32 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={l.tipoPessoa || "—"}
                        onValueChange={(v) => updateRecebimentoParceiro(l.cliente.id, l.competencia, { tipoPessoa: v === "—" ? undefined : (v as TipoPessoaRecebimento) })}
                      >
                        <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="—">—</SelectItem>
                          <SelectItem value="PF">PF</SelectItem>
                          <SelectItem value="PJ">PJ</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <button type="button" onClick={() => toggleStatus(l)} title="Alternar status de pagamento">
                        <StatusBadge status={l.status} className="cursor-pointer" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {g.extras.map((ex) => (
                  <TableRow key={ex.id} className="bg-sand-50/50">
                    <TableCell>
                      <Input
                        value={ex.descricao}
                        onChange={(e) => updateExtraParceiro(ex.id, { descricao: e.target.value })}
                        placeholder="Descrição (ex: Sistema)"
                        className="h-8 w-40 text-xs italic"
                      />
                    </TableCell>
                    {mes === "anual" && (
                      <TableCell className="text-sand-500">{inicioContratoLabel(ex.competencia)}</TableCell>
                    )}
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={ex.valor}
                        onChange={(e) => updateExtraParceiro(ex.id, { valor: Number(e.target.value) || 0 })}
                        className="h-8 w-28 text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-sand-400">—</TableCell>
                    <TableCell className="text-sand-400">—</TableCell>
                    <TableCell className="text-[11px] text-sand-400">Valor extra</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateExtraParceiro(ex.id, { status: ex.status === "Pago" ? "Em aberto" : "Pago" })}
                          title="Alternar status de pagamento"
                        >
                          <StatusBadge status={ex.status} className="cursor-pointer" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExtra(ex)}
                          title="Excluir valor extra"
                          className="rounded-md p-1 text-sand-400 transition-colors hover:bg-status-danger/10 hover:text-status-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={mes === "anual" ? 7 : 6} className="py-1">
                    <button
                      type="button"
                      onClick={handleAddExtra(g.parceiro)}
                      disabled={mes === "anual"}
                      title={mes === "anual" ? "Selecione um mês específico pra adicionar um valor extra" : "Adicionar valor extra"}
                      className="flex items-center gap-1 text-[11px] font-medium text-wine-700 hover:text-wine-800 disabled:cursor-not-allowed disabled:text-sand-300 disabled:hover:text-sand-300"
                    >
                      <Plus className="size-3" /> Adicionar valor extra
                    </button>
                  </TableCell>
                </TableRow>
                <TableRow className="bg-cream-100 hover:bg-cream-100">
                  <TableCell className="font-semibold text-wine-700">Total</TableCell>
                  {mes === "anual" && <TableCell />}
                  <TableCell className="font-semibold text-wine-700">{formatCurrency(g.total)}</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableBody>
            ))}
            {grupos.length === 0 && (
              <TableBody>
                <TableRow><TableCell colSpan={mes === "anual" ? 7 : 6} className="py-10 text-center text-sand-400">Nenhum cliente de parceiro com assessoria mensal encontrado.</TableCell></TableRow>
              </TableBody>
            )}
          </Table>
          <datalist id="parceiros-bancos">
            {bancoOptions.map((b) => (<option key={b} value={b} />))}
          </datalist>
        </CardContent>
      </Card>

      <NovoParceiroDialog open={novoParceiroOpen} onOpenChange={setNovoParceiroOpen} parceirosExistentes={parceirosExistentes} />
    </div>
  );
}

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
