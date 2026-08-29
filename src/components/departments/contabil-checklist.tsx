"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { ROTINAS_CONTABEIS_MENSAIS, ROTINAS_CONTABEIS_ANUAIS, type ChecklistStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const MESES = [
  { value: "01", label: "Jan" }, { value: "02", label: "Fev" }, { value: "03", label: "Mar" },
  { value: "04", label: "Abr" }, { value: "05", label: "Mai" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Ago" }, { value: "09", label: "Set" },
  { value: "10", label: "Out" }, { value: "11", label: "Nov" }, { value: "12", label: "Dez" },
];

const STATUS_STYLE: Record<ChecklistStatus, string> = {
  OK: "border-status-success bg-status-success-bg text-status-success",
  Pendente: "border-status-warning bg-status-warning-bg text-status-warning",
};

export function ContabilChecklist() {
  const clients = useAppStore((s) => s.clients);
  const checklist = useAppStore((s) => s.checklistContabil);
  const setChecklistContabil = useAppStore((s) => s.setChecklistContabil);

  const years = useMemo(() => {
    const set = new Set(clients.map((c) => c.criadoEm.slice(0, 4)));
    set.add(new Date().getFullYear().toString());
    return [...set].sort().reverse();
  }, [clients]);
  const [year, setYear] = useState(years[0]);
  const [period, setPeriod] = useState<"anual" | string>(String(new Date().getMonth() + 1).padStart(2, "0"));

  const myClients = clients.filter(
    (c) => c.responsaveis.contabil && (c.status === "Ativo" || c.status === "Com pendência" || c.status === "Onboarding")
  );

  const rotinas = period === "anual" ? ROTINAS_CONTABEIS_ANUAIS : ROTINAS_CONTABEIS_MENSAIS;
  const competencia = period === "anual" ? year : `${year}-${period}`;

  function statusFor(clienteId: string, rotina: string): ChecklistStatus | null {
    return checklist.find((e) => e.clienteId === clienteId && e.competencia === competencia && e.rotina === rotina)?.status ?? null;
  }

  const totalCells = myClients.length * rotinas.length;
  const okCells = myClients.reduce((sum, c) => sum + rotinas.filter((r) => statusFor(c.id, r) === "OK").length, 0);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Checklist de rotinas contábeis</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-sand-500">{okCells}/{totalCells} concluídas</span>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
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

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-0 text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 whitespace-nowrap bg-wine-800 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-cream-50">
                  Cliente
                </th>
                {rotinas.map((r) => (
                  <th key={r} className="whitespace-nowrap border-l border-wine-700 bg-wine-800 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-cream-50">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myClients.map((c) => (
                <tr key={c.id} className="odd:bg-sand-50/60">
                  <td className="sticky left-0 z-10 whitespace-nowrap border-b border-sand-200 bg-inherit px-3 py-2 font-medium text-sand-800">
                    <Link href={`/clientes/${c.id}`} className="hover:text-wine-700 hover:underline">
                      {c.dados.nomeFantasia ?? c.dados.razaoSocial}
                    </Link>
                  </td>
                  {rotinas.map((r) => {
                    const status = statusFor(c.id, r);
                    return (
                      <td key={r} className="border-b border-l border-sand-200 px-2 py-1.5">
                        <Select
                          value={status ?? "—"}
                          onValueChange={(v) => setChecklistContabil(c.id, competencia, r, v === "—" ? null : (v as ChecklistStatus))}
                        >
                          <SelectTrigger
                            className={cn(
                              "h-7 w-28 px-2 text-[11px]",
                              status && STATUS_STYLE[status]
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="—">—</SelectItem>
                            <SelectItem value="OK">OK</SelectItem>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {myClients.length === 0 && (
                <tr>
                  <td colSpan={rotinas.length + 1} className="py-8 text-center text-sand-400">
                    Nenhum cliente atribuído ao setor Contábil.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
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
