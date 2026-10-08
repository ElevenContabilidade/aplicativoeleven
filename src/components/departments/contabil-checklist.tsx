"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useAppStore } from "@/lib/store/app-store";
import { CHECKLIST_STATUS, ROTINAS_CONTABEIS_MENSAIS, ROTINAS_CONTABEIS_ANUAIS, rotinasContabeisFor, setorAtendidoPelaEleven, clienteAtivoNaCompetencia, type ChecklistStatus, type Client } from "@/lib/types";
import { cn } from "@/lib/utils";

const WINE = "#5C1420";

const MESES = [
  { value: "01", label: "Jan" }, { value: "02", label: "Fev" }, { value: "03", label: "Mar" },
  { value: "04", label: "Abr" }, { value: "05", label: "Mai" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Ago" }, { value: "09", label: "Set" },
  { value: "10", label: "Out" }, { value: "11", label: "Nov" }, { value: "12", label: "Dez" },
];

const YEARS = Array.from({ length: 2034 - 2024 + 1 }, (_, i) => String(2024 + i)).reverse();

const STATUS_STYLE: Record<ChecklistStatus, string> = {
  OK: "border-status-success bg-status-success-bg text-status-success",
  Pendente: "border-status-danger bg-status-danger-bg text-status-danger",
  "Em andamento": "border-status-warning bg-status-warning-bg text-status-warning",
  Dispensada: "border-status-brown bg-status-brown-bg text-status-brown",
};

function isDone(status: ChecklistStatus | null) {
  return status === "OK" || status === "Dispensada";
}

function pctColor(pct: number) {
  if (pct === 100) return "text-status-success";
  if (pct === 0) return "text-sand-400";
  return "text-status-warning";
}

export function ContabilChecklist() {
  const clients = useAppStore((s) => s.clients);
  const checklist = useAppStore((s) => s.checklistContabil);
  const setChecklistContabil = useAppStore((s) => s.setChecklistContabil);

  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [period, setPeriod] = useState<"anual" | string>(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [origemId, setOrigemId] = useState("");
  const [destinoId, setDestinoId] = useState("");
  const [somenteProprios, setSomenteProprios] = useState(false);

  const clientesDoSetor = useMemo(
    () =>
      clients.filter(
        (c) =>
          (c.status === "Ativo" || c.status === "Com pendência" || c.status === "Onboarding") &&
          setorAtendidoPelaEleven(c, "contabil") &&
          (!somenteProprios || !c.dados.clienteParceiro)
      ),
    [clients, somenteProprios]
  );

  const rotinas = period === "anual" ? ROTINAS_CONTABEIS_ANUAIS : ROTINAS_CONTABEIS_MENSAIS;
  const competencia = period === "anual" ? year : `${year}-${period}`;

  const myClients = useMemo(
    () => clientesDoSetor.filter((c) => clienteAtivoNaCompetencia(c, competencia)),
    [clientesDoSetor, competencia]
  );

  function statusFor(clienteId: string, comp: string, rotina: string): ChecklistStatus | null {
    return checklist.find((e) => e.clienteId === clienteId && e.competencia === comp && e.rotina === rotina)?.status ?? null;
  }

  function pctFor(clienteId: string, comp: string, list: readonly string[]) {
    if (list.length === 0) return 0;
    const done = list.filter((r) => isDone(statusFor(clienteId, comp, r))).length;
    return Math.round((done / list.length) * 100);
  }

  const totalCells = myClients.reduce((sum, c) => sum + rotinasContabeisFor(c, rotinas).length, 0);
  const okCells = myClients.reduce((sum, c) => sum + rotinasContabeisFor(c, rotinas).filter((r) => isDone(statusFor(c.id, competencia, r))).length, 0);
  const overallPct = totalCells > 0 ? Math.round((okCells / totalCells) * 100) : 0;

  const clientPcts = useMemo(
    () =>
      myClients
        .filter((c) => rotinasContabeisFor(c, rotinas).length > 0)
        .map((c) => ({ cliente: (c.dados.nomeFantasia ?? c.dados.razaoSocial).split(" ").slice(0, 2).join(" "), pct: pctFor(c.id, competencia, rotinasContabeisFor(c, rotinas)) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myClients, checklist, competencia, rotinas]
  );
  const clientesEmDia = clientPcts.filter((c) => c.pct === 100).length;
  const clientesPendentes = clientPcts.filter((c) => c.pct < 100).length;

  const monthlyTrend = useMemo(
    () =>
      MESES.map((m) => {
        const comp = `${year}-${m.value}`;
        const pcts = clientesDoSetor
          .filter((c) => clienteAtivoNaCompetencia(c, comp) && rotinasContabeisFor(c, ROTINAS_CONTABEIS_MENSAIS).length > 0)
          .map((c) => pctFor(c.id, comp, rotinasContabeisFor(c, ROTINAS_CONTABEIS_MENSAIS)));
        const avg = pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
        return { mes: m.label, pct: avg };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clientesDoSetor, checklist, year]
  );

  /** Copia o checklist de um cliente (mês corrente) pra uma lista de
   * clientes destino — só preenche rotinas aplicáveis a cada cliente que
   * ainda estão em branco (nunca sobrescreve uma marcação já feita). */
  async function aplicarChecklist(destino: Client[], confirmLabel: string) {
    const origem = myClients.find((c) => c.id === origemId);
    if (!origem || destino.length === 0) return;
    const nomeOrigem = origem.dados.nomeFantasia ?? origem.dados.razaoSocial;
    if (
      !confirm(
        `Copiar o checklist de "${nomeOrigem}" (${MESES.find((m) => m.value === period)?.label}/${year}) ${confirmLabel}?\n\nSó preenche as rotinas que ainda estão em branco — não mexe em nada que já foi marcado.`
      )
    )
      return;

    const atualizacoes: { clienteId: string; rotina: string; status: ChecklistStatus }[] = [];
    for (const cliente of destino) {
      const aplicaveis = rotinasContabeisFor(cliente, rotinas);
      for (const rotina of rotinas) {
        if (!aplicaveis.includes(rotina)) continue;
        if (statusFor(cliente.id, competencia, rotina) !== null) continue;
        const status = statusFor(origemId, competencia, rotina);
        if (status !== null) atualizacoes.push({ clienteId: cliente.id, rotina, status });
      }
    }

    // Marcar tudo de uma vez dispara uma gravação por célula ao mesmo
    // tempo — com dezenas de clientes isso passa do limite de requisições
    // simultâneas do navegador e algumas falhavam com "Failed to fetch".
    // Aplica em lotes pequenos, com uma pausa entre eles.
    const TAMANHO_LOTE = 15;
    for (let i = 0; i < atualizacoes.length; i += TAMANHO_LOTE) {
      for (const { clienteId, rotina, status } of atualizacoes.slice(i, i + TAMANHO_LOTE)) {
        setChecklistContabil(clienteId, competencia, rotina, status);
      }
      if (i + TAMANHO_LOTE < atualizacoes.length) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
  }

  async function handleAplicarParaTodos() {
    const destino = myClients.filter((c) => c.id !== origemId);
    await aplicarChecklist(destino, `pra outros ${destino.length} clientes`);
  }

  async function handleCopiarParaUm() {
    const destino = myClients.filter((c) => c.id === destinoId);
    const nomeDestino = destino[0]?.dados.nomeFantasia ?? destino[0]?.dados.razaoSocial ?? "";
    await aplicarChecklist(destino, `pra "${nomeDestino}"`);
  }

  return (
    <>
      <Card className="mt-4">
        <CardHeader><CardTitle>Dashboard contábil — {period === "anual" ? `rotinas anuais de ${year}` : `${MESES.find((m) => m.value === period)?.label}/${year}`}</CardTitle></CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-3 gap-4">
            <MiniStat label="Conclusão do período" value={`${overallPct}%`} tone={pctColor(overallPct)} />
            <MiniStat label="Clientes em dia" value={String(clientesEmDia)} tone="text-status-success" />
            <MiniStat label="Clientes com pendências" value={String(clientesPendentes)} tone="text-status-danger" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold text-sand-700">% concluído por cliente no período</p>
              <div className="h-56 w-full">
                <ResponsiveContainer>
                  <BarChart data={clientPcts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D6" vertical={false} />
                    <XAxis dataKey="cliente" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="pct" fill={WINE} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-sand-700">Evolução mensal (rotinas mensais, média da carteira) — {year}</p>
              <div className="h-56 w-full">
                <ResponsiveContainer>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D6" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Line type="monotone" dataKey="pct" stroke={WINE} strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Checklist de rotinas contábeis</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-sand-500">{okCells}/{totalCells} concluídas</span>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <PeriodChip label="Anual" active={period === "anual"} onClick={() => setPeriod("anual")} />
              {MESES.map((m) => (
                <PeriodChip key={m.value} label={m.label} active={period === m.value} onClick={() => setPeriod(m.value)} />
              ))}
            </div>
            <PeriodChip label="Só clientes próprios da Eleven" active={somenteProprios} onClick={() => setSomenteProprios((v) => !v)} />
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-sand-500">Copiar checklist de:</span>
            <Select value={origemId} onValueChange={(v) => { setOrigemId(v); if (v === destinoId) setDestinoId(""); }}>
              <SelectTrigger className="h-8 w-56 text-xs"><SelectValue placeholder="Escolha um cliente" /></SelectTrigger>
              <SelectContent>
                {myClients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.dados.nomeFantasia ?? c.dados.razaoSocial}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-[11px] text-sand-500">para:</span>
            <Select value={destinoId} onValueChange={setDestinoId}>
              <SelectTrigger className="h-8 w-56 text-xs"><SelectValue placeholder="Um cliente específico" /></SelectTrigger>
              <SelectContent>
                {myClients.filter((c) => c.id !== origemId).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.dados.nomeFantasia ?? c.dados.razaoSocial}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" size="sm" variant="outline" disabled={!origemId || !destinoId} onClick={handleCopiarParaUm}>
              <Copy className="size-3.5" /> Copiar só pra esse
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={!origemId} onClick={handleAplicarParaTodos}>
              <Copy className="size-3.5" /> Aplicar pros demais clientes do mês
            </Button>
            <span className="text-[11px] text-sand-400">preenche só quem ainda está em branco</span>
          </div>

          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full min-w-[960px] border-separate border-spacing-0 text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 top-0 z-20 whitespace-nowrap bg-wine-800 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-cream-50">
                    Cliente
                  </th>
                  {rotinas.map((r) => (
                    <th key={r} className="sticky top-0 z-20 whitespace-nowrap border-l border-wine-700 bg-wine-800 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-cream-50">
                      {r}
                    </th>
                  ))}
                  <th className="sticky top-0 z-20 whitespace-nowrap border-l border-wine-700 bg-wine-800 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-cream-50">
                    % concluído
                  </th>
                </tr>
              </thead>
              <tbody>
                {myClients.map((c) => (
                  <ClientRow
                    key={c.id}
                    client={c}
                    rotinas={rotinas}
                    applicable={rotinasContabeisFor(c, rotinas)}
                    competencia={competencia}
                    statusFor={statusFor}
                    setChecklistContabil={setChecklistContabil}
                    pct={pctFor(c.id, competencia, rotinasContabeisFor(c, rotinas))}
                  />
                ))}
                {myClients.length === 0 && (
                  <tr>
                    <td colSpan={rotinas.length + 2} className="py-8 text-center text-sand-400">
                      Nenhum cliente atribuído ao setor Contábil.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function ClientRow({
  client: c,
  rotinas,
  applicable,
  competencia,
  statusFor,
  setChecklistContabil,
  pct,
}: {
  client: Client;
  rotinas: readonly string[];
  applicable?: string[];
  competencia: string;
  statusFor: (clienteId: string, competencia: string, rotina: string) => ChecklistStatus | null;
  setChecklistContabil: (clienteId: string, competencia: string, rotina: string, status: ChecklistStatus | null) => void;
  pct: number;
}) {
  return (
    <tr className="bg-white odd:bg-sand-50">
      <td className="sticky left-0 z-10 whitespace-nowrap border-b border-sand-200 bg-inherit px-3 py-2 font-medium text-sand-800">
        <Link href={`/clientes/${c.id}`} className="hover:text-wine-700 hover:underline">
          {c.dados.nomeFantasia ?? c.dados.razaoSocial}
        </Link>
      </td>
      {rotinas.map((r) => {
        if (applicable && !applicable.includes(r)) {
          return (
            <td key={r} className="border-b border-l border-sand-200 px-2 py-1.5 text-center text-sand-300">
              —
            </td>
          );
        }
        const status = statusFor(c.id, competencia, r);
        return (
          <td key={r} className="border-b border-l border-sand-200 px-2 py-1.5">
            <Select
              value={status ?? "—"}
              onValueChange={(v) => setChecklistContabil(c.id, competencia, r, v === "—" ? null : (v as ChecklistStatus))}
            >
              <SelectTrigger className={cn("h-7 w-36 mx-auto justify-center whitespace-nowrap px-2 text-[11px] font-semibold uppercase", status && STATUS_STYLE[status])}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="—">—</SelectItem>
                {CHECKLIST_STATUS.map((s) => (
                  <SelectItem key={s} value={s} className="uppercase">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </td>
        );
      })}
      <td className="border-b border-l border-sand-200 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-sand-200">
            <div
              className={cn("h-full rounded-full", pct === 100 ? "bg-status-success" : pct === 0 ? "bg-sand-300" : "bg-status-warning")}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={cn("font-semibold", pctColor(pct))}>{pct}%</span>
        </div>
      </td>
    </tr>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-sand-200 p-4">
      <p className="text-[11px] text-sand-500">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold", tone)}>{value}</p>
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
