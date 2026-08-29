"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { CHECKLIST_STATUS, ROTINAS_FISCAIS_MENSAIS, rotinasFiscaisAnuais, type ChecklistStatus, type Client } from "@/lib/types";
import { cn } from "@/lib/utils";

const WINE = "#5C1420";

const MESES = [
  { value: "01", label: "Jan" }, { value: "02", label: "Fev" }, { value: "03", label: "Mar" },
  { value: "04", label: "Abr" }, { value: "05", label: "Mai" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Ago" }, { value: "09", label: "Set" },
  { value: "10", label: "Out" }, { value: "11", label: "Nov" }, { value: "12", label: "Dez" },
];

const YEARS = Array.from({ length: 2034 - 2024 + 1 }, (_, i) => String(2024 + i)).reverse();

const REGIME_GROUPS: { label: string; match: (c: Client) => boolean }[] = [
  { label: "Simples Nacional", match: (c) => c.dados.regimeTributario === "Simples Nacional" },
  { label: "MEI", match: (c) => c.dados.regimeTributario === "MEI" },
  { label: "Lucro Presumido / Lucro Real", match: (c) => c.dados.regimeTributario === "Lucro Presumido" || c.dados.regimeTributario === "Lucro Real" },
];

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

function rotinasFor(client: Client, period: string): string[] {
  return period === "anual" ? rotinasFiscaisAnuais(client) : [...ROTINAS_FISCAIS_MENSAIS];
}

export function FiscalChecklist() {
  const clients = useAppStore((s) => s.clients);
  const checklist = useAppStore((s) => s.checklistFiscal);
  const setChecklistFiscal = useAppStore((s) => s.setChecklistFiscal);

  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [period, setPeriod] = useState<"anual" | string>(String(new Date().getMonth() + 1).padStart(2, "0"));

  const myClients = useMemo(
    () => clients.filter((c) => c.responsaveis.fiscal && (c.status === "Ativo" || c.status === "Com pendência" || c.status === "Onboarding")),
    [clients]
  );

  const competencia = period === "anual" ? year : `${year}-${period}`;

  function statusFor(clienteId: string, comp: string, rotina: string): ChecklistStatus | null {
    return checklist.find((e) => e.clienteId === clienteId && e.competencia === comp && e.rotina === rotina)?.status ?? null;
  }

  function pctForList(clienteId: string, comp: string, list: string[]) {
    if (list.length === 0) return 0;
    const done = list.filter((r) => isDone(statusFor(clienteId, comp, r))).length;
    return Math.round((done / list.length) * 100);
  }

  function pctFor(client: Client, comp: string) {
    return pctForList(client.id, comp, rotinasFor(client, period));
  }

  const totalCells = myClients.reduce((sum, c) => sum + rotinasFor(c, period).length, 0);
  const okCells = myClients.reduce(
    (sum, c) => sum + rotinasFor(c, period).filter((r) => isDone(statusFor(c.id, competencia, r))).length,
    0
  );
  const overallPct = totalCells > 0 ? Math.round((okCells / totalCells) * 100) : 0;

  const clientPcts = useMemo(
    () => myClients.map((c) => ({ cliente: (c.dados.nomeFantasia ?? c.dados.razaoSocial).split(" ").slice(0, 2).join(" "), pct: pctFor(c, competencia) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myClients, checklist, competencia, period]
  );
  const clientesEmDia = clientPcts.filter((c) => c.pct === 100).length;
  const clientesPendentes = clientPcts.filter((c) => c.pct < 100).length;

  const monthlyTrend = useMemo(
    () =>
      MESES.map((m) => {
        const comp = `${year}-${m.value}`;
        const pcts = myClients.map((c) => pctForList(c.id, comp, [...ROTINAS_FISCAIS_MENSAIS]));
        const avg = pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
        return { mes: m.label, pct: avg };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myClients, checklist, year]
  );

  const groupsWithClients = REGIME_GROUPS.map((g) => ({ ...g, clients: myClients.filter(g.match) })).filter((g) => g.clients.length > 0);

  return (
    <>
      <Card className="mt-4">
        <CardHeader><CardTitle>Dashboard fiscal — {period === "anual" ? `obrigações anuais de ${year}` : `${MESES.find((m) => m.value === period)?.label}/${year}`}</CardTitle></CardHeader>
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
          <CardTitle>Checklist de rotinas fiscais</CardTitle>
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
          <div className="mb-4 flex flex-wrap gap-1.5">
            <PeriodChip label="Anual" active={period === "anual"} onClick={() => setPeriod("anual")} />
            {MESES.map((m) => (
              <PeriodChip key={m.value} label={m.label} active={period === m.value} onClick={() => setPeriod(m.value)} />
            ))}
          </div>

          {period === "anual" ? (
            <div className="space-y-6">
              <p className="text-[11px] text-sand-500">
                A obrigação anual varia por enquadramento — <strong>Simples Nacional</strong> declara DEFIS, <strong>MEI</strong> declara DASN-MEI e{" "}
                <strong>Lucro Presumido/Real</strong> entrega ECF. Clientes da área da saúde (tag #Saúde) somam a DMED, independente do regime.
              </p>
              {groupsWithClients.map((g) => {
                const base = rotinasFiscaisAnuais(g.clients[0])[0];
                const hasHealth = g.clients.some((c) => c.tags.includes("#Saúde"));
                const columns = hasHealth ? [base, "DMED"] : [base];
                return (
                  <div key={g.label}>
                    <p className="mb-2 text-xs font-semibold text-sand-700">
                      {g.label} <span className="font-normal text-sand-400">— {columns.join(" + ")}</span>
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] border-separate border-spacing-0 text-xs">
                        <thead>
                          <tr>
                            <th className="sticky left-0 z-10 whitespace-nowrap bg-wine-800 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-cream-50">
                              Cliente
                            </th>
                            {columns.map((r) => (
                              <th key={r} className="whitespace-nowrap border-l border-wine-700 bg-wine-800 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-cream-50">
                                {r}
                              </th>
                            ))}
                            <th className="whitespace-nowrap border-l border-wine-700 bg-wine-800 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-cream-50">
                              % concluído
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.clients.map((c) => (
                            <ClientRow
                              key={c.id}
                              client={c}
                              columns={columns}
                              applicable={rotinasFiscaisAnuais(c)}
                              competencia={competencia}
                              statusFor={statusFor}
                              setChecklist={setChecklistFiscal}
                              pct={pctFor(c, competencia)}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
              {groupsWithClients.length === 0 && <p className="py-8 text-center text-sand-400">Nenhum cliente atribuído ao setor Fiscal.</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 whitespace-nowrap bg-wine-800 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-cream-50">
                      Cliente
                    </th>
                    {ROTINAS_FISCAIS_MENSAIS.map((r) => (
                      <th key={r} className="whitespace-nowrap border-l border-wine-700 bg-wine-800 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-cream-50">
                        {r}
                      </th>
                    ))}
                    <th className="whitespace-nowrap border-l border-wine-700 bg-wine-800 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-cream-50">
                      % concluído
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {myClients.map((c) => (
                    <ClientRow
                      key={c.id}
                      client={c}
                      columns={[...ROTINAS_FISCAIS_MENSAIS]}
                      competencia={competencia}
                      statusFor={statusFor}
                      setChecklist={setChecklistFiscal}
                      pct={pctFor(c, competencia)}
                    />
                  ))}
                  {myClients.length === 0 && (
                    <tr>
                      <td colSpan={ROTINAS_FISCAIS_MENSAIS.length + 2} className="py-8 text-center text-sand-400">
                        Nenhum cliente atribuído ao setor Fiscal.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function ClientRow({
  client: c,
  columns,
  applicable,
  competencia,
  statusFor,
  setChecklist,
  pct,
}: {
  client: Client;
  columns: string[];
  applicable?: string[];
  competencia: string;
  statusFor: (clienteId: string, competencia: string, rotina: string) => ChecklistStatus | null;
  setChecklist: (clienteId: string, competencia: string, rotina: string, status: ChecklistStatus | null) => void;
  pct: number;
}) {
  return (
    <tr className="odd:bg-sand-50/60">
      <td className="sticky left-0 z-10 whitespace-nowrap border-b border-sand-200 bg-inherit px-3 py-2 font-medium text-sand-800">
        <Link href={`/clientes/${c.id}`} className="hover:text-wine-700 hover:underline">
          {c.dados.nomeFantasia ?? c.dados.razaoSocial}
        </Link>
      </td>
      {columns.map((r) => {
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
              onValueChange={(v) => setChecklist(c.id, competencia, r, v === "—" ? null : (v as ChecklistStatus))}
            >
              <SelectTrigger className={cn("h-7 w-28 mx-auto justify-center px-2 text-[11px] font-semibold uppercase", status && STATUS_STYLE[status])}>
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
