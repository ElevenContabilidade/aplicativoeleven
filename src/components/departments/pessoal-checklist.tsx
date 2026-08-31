"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import {
  CHECKLIST_STATUS,
  ROTINAS_PESSOAL_FIXAS,
  ROTINAS_PESSOAL_VARIAVEIS,
  ROTINA_PESSOAL_ANUAL,
  possuiFuncionarios,
  type ChecklistStatus,
  type Client,
} from "@/lib/types";
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

function rotinasFor(client: Client, period: string): string[] {
  if (period === "anual") return possuiFuncionarios(client) ? [ROTINA_PESSOAL_ANUAL] : [];
  return [...ROTINAS_PESSOAL_FIXAS, ...ROTINAS_PESSOAL_VARIAVEIS];
}

export function PessoalChecklist() {
  const clients = useAppStore((s) => s.clients);
  const checklist = useAppStore((s) => s.checklistPessoal);
  const setChecklistPessoal = useAppStore((s) => s.setChecklistPessoal);

  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [period, setPeriod] = useState<"anual" | string>(String(new Date().getMonth() + 1).padStart(2, "0"));

  const myClients = useMemo(
    () => clients.filter((c) => c.status === "Ativo" || c.status === "Com pendência" || c.status === "Onboarding"),
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

  const applicableClients = myClients.filter((c) => rotinasFor(c, period).length > 0);

  const totalCells = applicableClients.reduce((sum, c) => sum + rotinasFor(c, period).length, 0);
  const okCells = applicableClients.reduce(
    (sum, c) => sum + rotinasFor(c, period).filter((r) => isDone(statusFor(c.id, competencia, r))).length,
    0
  );
  const overallPct = totalCells > 0 ? Math.round((okCells / totalCells) * 100) : 0;

  const clientPcts = useMemo(
    () => applicableClients.map((c) => ({ cliente: (c.dados.nomeFantasia ?? c.dados.razaoSocial).split(" ").slice(0, 2).join(" "), pct: pctFor(c, competencia) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applicableClients, checklist, competencia, period]
  );
  const clientesEmDia = clientPcts.filter((c) => c.pct === 100).length;
  const clientesPendentes = clientPcts.filter((c) => c.pct < 100).length;

  const monthlyTrend = useMemo(
    () =>
      MESES.map((m) => {
        const comp = `${year}-${m.value}`;
        const pcts = myClients.map((c) => pctForList(c.id, comp, [...ROTINAS_PESSOAL_FIXAS, ...ROTINAS_PESSOAL_VARIAVEIS]));
        const avg = pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
        return { mes: m.label, pct: avg };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myClients, checklist, year]
  );

  const clientesComFuncionarios = myClients.filter(possuiFuncionarios);

  return (
    <>
      <Card className="mt-4">
        <CardHeader><CardTitle>Dashboard pessoal — {period === "anual" ? `obrigações anuais de ${year}` : `${MESES.find((m) => m.value === period)?.label}/${year}`}</CardTitle></CardHeader>
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
              <p className="mb-2 text-xs font-semibold text-sand-700">Evolução mensal (rotinas fixas + variáveis, média da carteira) — {year}</p>
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
          <CardTitle>Checklist de rotinas do Departamento Pessoal</CardTitle>
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
            <div>
              <p className="mb-3 text-[11px] text-sand-500">
                A <strong>{ROTINA_PESSOAL_ANUAL}</strong> só é devida por clientes com folha ativa (funcionários registrados). Clientes sem funcionários não aparecem nesta lista.
              </p>
              {clientesComFuncionarios.length > 0 ? (
                <RotinaTable
                  clients={clientesComFuncionarios}
                  columns={[ROTINA_PESSOAL_ANUAL]}
                  competencia={competencia}
                  statusFor={statusFor}
                  setChecklist={setChecklistPessoal}
                  pctForClient={(c) => pctFor(c, competencia)}
                />
              ) : (
                <p className="py-8 text-center text-sand-400">Nenhum cliente do setor Pessoal possui funcionários registrados.</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-xs font-semibold text-sand-700">Rotinas Fixas Departamento Pessoal</p>
                <RotinaTable
                  clients={myClients}
                  columns={[...ROTINAS_PESSOAL_FIXAS]}
                  competencia={competencia}
                  statusFor={statusFor}
                  setChecklist={setChecklistPessoal}
                  pctForClient={(c) => pctForList(c.id, competencia, [...ROTINAS_PESSOAL_FIXAS])}
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-sand-700">Rotinas Variáveis Departamento Pessoal</p>
                <RotinaTable
                  clients={myClients}
                  columns={[...ROTINAS_PESSOAL_VARIAVEIS]}
                  competencia={competencia}
                  statusFor={statusFor}
                  setChecklist={setChecklistPessoal}
                  pctForClient={(c) => pctForList(c.id, competencia, [...ROTINAS_PESSOAL_VARIAVEIS])}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function RotinaTable({
  clients,
  columns,
  competencia,
  statusFor,
  setChecklist,
  pctForClient,
}: {
  clients: Client[];
  columns: string[];
  competencia: string;
  statusFor: (clienteId: string, competencia: string, rotina: string) => ChecklistStatus | null;
  setChecklist: (clienteId: string, competencia: string, rotina: string, status: ChecklistStatus | null) => void;
  pctForClient: (client: Client) => number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-separate border-spacing-0 text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 whitespace-nowrap bg-wine-800 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-cream-50">
              Cliente
            </th>
            {columns.map((r) => (
              <th key={r} className="whitespace-nowrap border-l border-wine-700 bg-wine-800 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-cream-50">
                {r}
              </th>
            ))}
            <th className="whitespace-nowrap border-l border-wine-700 bg-wine-800 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-cream-50">
              % concluído
            </th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => {
            const pct = pctForClient(c);
            return (
              <tr key={c.id} className="odd:bg-sand-50/60">
                <td className="sticky left-0 z-10 whitespace-nowrap border-b border-sand-200 bg-inherit px-3 py-2 font-medium text-sand-800">
                  <Link href={`/clientes/${c.id}`} className="hover:text-wine-700 hover:underline">
                    {c.dados.nomeFantasia ?? c.dados.razaoSocial}
                  </Link>
                </td>
                {columns.map((r) => {
                  const status = statusFor(c.id, competencia, r);
                  return (
                    <td key={r} className="border-b border-l border-sand-200 px-2 py-1.5">
                      <Select
                        value={status ?? "—"}
                        onValueChange={(v) => setChecklist(c.id, competencia, r, v === "—" ? null : (v as ChecklistStatus))}
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
          })}
          {clients.length === 0 && (
            <tr>
              <td colSpan={columns.length + 2} className="py-8 text-center text-sand-400">
                Nenhum cliente atribuído ao setor Pessoal.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
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
