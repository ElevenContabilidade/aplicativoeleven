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

interface LinhaExtra {
  extra: ExtraParceiro;
  competencia: string;
  status: StatusPagamentoParceiro;
  banco: string;
  tipoPessoa: TipoPessoaRecebimento | "";
}

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
  const pagamentosExtrasParceiro = useAppStore((s) => s.pagamentosExtrasParceiro);
  const boletosMensais = useAppStore((s) => s.boletosMensais);
  const recebimentos = useAppStore((s) => s.recebimentos);
  const updateRecebimentoParceiro = useAppStore((s) => s.updateRecebimentoParceiro);
  const addExtraParceiro = useAppStore((s) => s.addExtraParceiro);
  const updateExtraParceiro = useAppStore((s) => s.updateExtraParceiro);
  const updatePagamentoExtraParceiro = useAppStore((s) => s.updatePagamentoExtraParceiro);

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
   * por ele), fora do que vem do cadastro de cada cliente — recorrentes
   * (mesma lógica dos sistemas do escritório): uma linha por competência do
   * período, usando o valorMensal do extra e o status daquele mês quando já
   * existe. */
  const linhasExtras: LinhaExtra[] = useMemo(() => {
    const pagamentoMap = new Map(pagamentosExtrasParceiro.map((p) => [`${p.extraParceiroId}__${p.competencia}`, p]));
    const list: LinhaExtra[] = [];
    for (const extra of extrasParceiro) {
      for (const comp of competencias) {
        if (extra.inicioCompetencia && comp < extra.inicioCompetencia) continue;
        const pagamento = pagamentoMap.get(`${extra.id}__${comp}`);
        if (pagamento?.removido) continue;
        list.push({
          extra,
          competencia: comp,
          status: pagamento?.status ?? "Em aberto",
          banco: pagamento?.banco ?? "",
          tipoPessoa: pagamento?.tipoPessoa ?? "",
        });
      }
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extrasParceiro, pagamentosExtrasParceiro, year, mes]);

  const extrasFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return linhasExtras;
    return linhasExtras.filter((le) => le.extra.nomeParceiro.toLowerCase().includes(q));
  }, [linhasExtras, busca]);

  const grupos = useMemo(() => {
    const porParceiro = new Map<string, { linhas: Linha[]; extras: LinhaExtra[] }>();
    for (const l of filtradas) {
      const nome = l.cliente.dados.nomeParceiro?.trim() || "Sem parceiro definido";
      const grupo = porParceiro.get(nome) ?? { linhas: [], extras: [] };
      grupo.linhas.push(l);
      porParceiro.set(nome, grupo);
    }
    for (const le of extrasFiltradas) {
      const nome = le.extra.nomeParceiro.trim() || "Sem parceiro definido";
      const grupo = porParceiro.get(nome) ?? { linhas: [], extras: [] };
      grupo.extras.push(le);
      porParceiro.set(nome, grupo);
    }
    return [...porParceiro.entries()]
      .map(([parceiro, { linhas, extras }]) => {
        const recebido =
          linhas.filter((l) => l.status === "Pago").reduce((sum, l) => sum + l.valor, 0) +
          extras.filter((le) => le.status === "Pago").reduce((sum, le) => sum + le.extra.valorMensal, 0);
        const emAberto =
          linhas.filter((l) => l.status === "Em aberto").reduce((sum, l) => sum + l.valor, 0) +
          extras.filter((le) => le.status === "Em aberto").reduce((sum, le) => sum + le.extra.valorMensal, 0);
        return {
          parceiro,
          linhas: linhas.sort((a, b) => {
            const nomeCompare = (a.cliente.dados.nomeFantasia ?? a.cliente.dados.razaoSocial).localeCompare(
              b.cliente.dados.nomeFantasia ?? b.cliente.dados.razaoSocial,
              "pt-BR"
            );
            return nomeCompare !== 0 ? nomeCompare : a.competencia.localeCompare(b.competencia);
          }),
          extras: extras.sort((a, b) => {
            const descCompare = a.extra.descricao.localeCompare(b.extra.descricao, "pt-BR");
            return descCompare !== 0 ? descCompare : a.competencia.localeCompare(b.competencia);
          }),
          total: recebido + emAberto,
          recebido,
          emAberto,
        };
      })
      .sort((a, b) => a.parceiro.localeCompare(b.parceiro, "pt-BR"));
  }, [filtradas, extrasFiltradas]);

  const totalRecebido =
    filtradas.filter((l) => l.status === "Pago").reduce((a, l) => a + l.valor, 0) +
    extrasFiltradas.filter((le) => le.status === "Pago").reduce((a, le) => a + le.extra.valorMensal, 0);
  const totalEmAberto =
    filtradas.filter((l) => l.status === "Em aberto").reduce((a, l) => a + l.valor, 0) +
    extrasFiltradas.filter((le) => le.status === "Em aberto").reduce((a, le) => a + le.extra.valorMensal, 0);
  // MRR = tudo que os parceiros pagam no período (Recebido + Em aberto) —
  // reflete os valores de verdade (ajustados por competência + extras),
  // não só o valorMensal fixo cadastrado no cliente.
  const mrr = totalRecebido + totalEmAberto;

  function toggleStatus(l: Linha) {
    updateRecebimentoParceiro(l.cliente.id, l.competencia, { status: l.status === "Pago" ? "Em aberto" : "Pago" });
  }

  /** Acha os outros clientes do mesmo parceiro, na mesma competência, que
   * ainda não têm banco/tipo definido — usado pra replicar automaticamente
   * o banco/tipo do primeiro lançamento pros demais, evitando marcar campo
   * por campo quando o dinheiro de todo mundo do mesmo parceiro cai sempre
   * no mesmo lugar. */
  function outrosDoGrupoSemValor(l: Linha, campo: "banco" | "tipoPessoa") {
    const nomeParceiro = l.cliente.dados.nomeParceiro?.trim() || "Sem parceiro definido";
    return linhas.filter(
      (outra) =>
        outra.cliente.id !== l.cliente.id &&
        outra.competencia === l.competencia &&
        (outra.cliente.dados.nomeParceiro?.trim() || "Sem parceiro definido") === nomeParceiro &&
        !outra[campo]
    );
  }

  function handleBancoChange(l: Linha, banco: string) {
    updateRecebimentoParceiro(l.cliente.id, l.competencia, { banco });
    if (!banco) return;
    for (const outra of outrosDoGrupoSemValor(l, "banco")) {
      updateRecebimentoParceiro(outra.cliente.id, outra.competencia, { banco });
    }
  }

  function handleTipoChange(l: Linha, tipo: TipoPessoaRecebimento | undefined) {
    updateRecebimentoParceiro(l.cliente.id, l.competencia, { tipoPessoa: tipo });
    if (!tipo) return;
    for (const outra of outrosDoGrupoSemValor(l, "tipoPessoa")) {
      updateRecebimentoParceiro(outra.cliente.id, outra.competencia, { tipoPessoa: tipo });
    }
  }

  function handleDeleteLinha(l: Linha) {
    const nome = l.cliente.dados.nomeFantasia ?? l.cliente.dados.razaoSocial;
    if (confirm(`Excluir o lançamento de "${nome}" em ${inicioContratoLabel(l.competencia)}?`)) {
      updateRecebimentoParceiro(l.cliente.id, l.competencia, { removido: true });
    }
  }

  function handleAddExtra(parceiro: string) {
    return () => {
      const id = `extra-${Date.now()}`;
      addExtraParceiro({
        id,
        nomeParceiro: parceiro,
        descricao: "",
        valorMensal: 0,
        inicioCompetencia: mes === "anual" ? undefined : `${year}-${mes}`,
      });
    };
  }

  function toggleStatusExtra(le: LinhaExtra) {
    updatePagamentoExtraParceiro(le.extra.id, le.competencia, { status: le.status === "Pago" ? "Em aberto" : "Pago" });
  }

  function handleDeleteExtraLinha(le: LinhaExtra) {
    if (confirm(`Excluir o lançamento de "${le.extra.descricao || "valor extra"}" em ${inicioContratoLabel(le.competencia)}?`)) {
      updatePagamentoExtraParceiro(le.extra.id, le.competencia, { removido: true });
    }
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
                        onChange={(e) => handleBancoChange(l, e.target.value)}
                        placeholder="Em qual banco"
                        list="parceiros-bancos"
                        className="h-8 w-32 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={l.tipoPessoa || "—"}
                        onValueChange={(v) => handleTipoChange(l, v === "—" ? undefined : (v as TipoPessoaRecebimento))}
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
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => toggleStatus(l)} title="Alternar status de pagamento">
                          <StatusBadge status={l.status} className="cursor-pointer" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLinha(l)}
                          title="Excluir lançamento"
                          className="rounded-md p-1 text-sand-400 transition-colors hover:bg-status-danger/10 hover:text-status-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {g.extras.map((le) => (
                  <TableRow key={`${le.extra.id}-${le.competencia}`} className="bg-sand-50/50">
                    <TableCell>
                      <Input
                        value={le.extra.descricao}
                        onChange={(e) => updateExtraParceiro(le.extra.id, { descricao: e.target.value })}
                        placeholder="Descrição (ex: Sistema)"
                        className="h-8 w-40 text-xs italic"
                      />
                    </TableCell>
                    {mes === "anual" && (
                      <TableCell className="text-sand-500">{inicioContratoLabel(le.competencia)}</TableCell>
                    )}
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={le.extra.valorMensal}
                        onChange={(e) => updateExtraParceiro(le.extra.id, { valorMensal: Number(e.target.value) || 0 })}
                        className="h-8 w-28 text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-sand-400">—</TableCell>
                    <TableCell>
                      <Input
                        value={le.banco ?? ""}
                        onChange={(e) => updatePagamentoExtraParceiro(le.extra.id, le.competencia, { banco: e.target.value })}
                        placeholder="Em qual banco"
                        list="parceiros-bancos"
                        className="h-8 w-32 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={le.tipoPessoa || "—"}
                        onValueChange={(v) => updatePagamentoExtraParceiro(le.extra.id, le.competencia, { tipoPessoa: v === "—" ? undefined : (v as TipoPessoaRecebimento) })}
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
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleStatusExtra(le)}
                          title="Alternar status de pagamento"
                        >
                          <StatusBadge status={le.status} className="cursor-pointer" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExtraLinha(le)}
                          title="Excluir lançamento"
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
                  <TableCell className="font-semibold text-wine-700">Total a receber</TableCell>
                  {mes === "anual" && <TableCell />}
                  <TableCell className="font-semibold text-wine-700">{formatCurrency(g.total)}</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
                <TableRow className="bg-cream-50 hover:bg-cream-50">
                  <TableCell className="text-status-success">Recebido</TableCell>
                  {mes === "anual" && <TableCell />}
                  <TableCell className="text-status-success">{formatCurrency(g.recebido)}</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
                <TableRow className="bg-cream-50 hover:bg-cream-50">
                  <TableCell className="text-status-warning">Resta receber</TableCell>
                  {mes === "anual" && <TableCell />}
                  <TableCell className="text-status-warning">{formatCurrency(g.emAberto)}</TableCell>
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
