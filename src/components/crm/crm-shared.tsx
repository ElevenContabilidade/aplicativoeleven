"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/lib/store/app-store";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

export const WINE = "#5C1420";
export const GOLD = "#E6C378";
export const WINE_SHADES = ["#5C1420", "#7A1D2B", "#99283A", "#B84A58", "#D17883", "#E6C378"];

export const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
export const MESES_VALUE = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

export function PeriodChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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

export function ChartCard({ title, extra, children }: { title: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-sand-900">{title}</p>
          {extra}
        </div>
        <div className="h-56 w-full">{children}</div>
      </CardContent>
    </Card>
  );
}

export function StatTile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[11px] text-sand-500">{label}</p>
        <p className={cn("mt-1 text-lg font-semibold", highlight ? "text-wine-700" : "text-sand-900")}>{value}</p>
      </CardContent>
    </Card>
  );
}

export function periodoLabelFor(year: string, mes: string) {
  return mes === "anual" ? year : `${MESES[MESES_VALUE.indexOf(mes)]}/${year}`;
}

/** Leads do ano selecionado e, dentro dele, do mês (se não for "ano
 * inteiro") — pela data de entrada do lead no funil. Compartilhado por
 * todas as abas do CRM que respeitam o seletor de período. */
export function usePeriodoLeads(year: string, mes: string) {
  const leads = useAppStore((s) => s.leads);
  const leadsDoAno = useMemo(() => leads.filter((l) => l.dataEntrada.startsWith(year)), [leads, year]);
  const leadsFiltrados = useMemo(
    () => (mes === "anual" ? leadsDoAno : leadsDoAno.filter((l) => l.dataEntrada.slice(5, 7) === mes)),
    [leadsDoAno, mes]
  );
  return { leads, leadsDoAno, leadsFiltrados };
}

/** Data (YYYY-MM-DD) em que o lead foi decidido (entrou em "Fechado" ou
 * "Perdido") — a última vez que o histórico registra essa transição. Cai
 * pra dataUltimoContato se não achar (lead antigo, sem histórico migrado). */
export function dataDecisaoLead(lead: Lead): string {
  const entrada = [...lead.historico].reverse().find((h) => h.paraStage === "Fechado" || h.paraStage === "Perdido");
  return entrada?.data ?? lead.dataUltimoContato;
}

export function diasEntre(dataInicioIso: string, dataFimIso: string) {
  const ms = new Date(dataFimIso + "T00:00:00").getTime() - new Date(dataInicioIso + "T00:00:00").getTime();
  return Math.max(0, Math.round(ms / 86400000));
}
