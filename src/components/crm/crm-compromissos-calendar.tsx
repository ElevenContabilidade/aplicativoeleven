"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/team-lookup";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES_NOME = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type Visao = "mes" | "semana" | "dia";

function diasDoMes(ano: number, mes: number) {
  return new Date(ano, mes + 1, 0).getDate();
}

function iso(ano: number, mes: number, dia: number) {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function CompromissoItem({ lead }: { lead: Lead }) {
  return (
    <div className="rounded-lg border border-sand-200 bg-white px-2.5 py-1.5 text-[11px]">
      <p className="truncate font-medium text-sand-900">{lead.nome}</p>
      <div className="mt-0.5 flex items-center gap-2 text-sand-500">
        {lead.reuniao?.horario && (
          <span className="flex items-center gap-0.5"><Clock className="size-3" /> {lead.reuniao.horario}</span>
        )}
        <span className="flex items-center gap-0.5 truncate"><Phone className="size-3" /> {teamName(lead.responsavelId).split(" ")[0]}</span>
      </div>
    </div>
  );
}

/** Aba Compromissos: agenda de reuniões marcadas com leads (lead.reuniao),
 * em visão mensal (grade de calendário), semanal ou diária. */
export function CrmCompromissosCalendar() {
  const leads = useAppStore((s) => s.leads);
  const leadsComReuniao = useMemo(() => leads.filter((l) => l.reuniao?.data), [leads]);

  const [visao, setVisao] = useState<Visao>("mes");
  const [cursor, setCursor] = useState(() => new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  const porDia = useMemo(() => {
    const map = new Map<string, Lead[]>();
    leadsComReuniao.forEach((l) => {
      const data = l.reuniao!.data;
      map.set(data, [...(map.get(data) ?? []), l]);
    });
    return map;
  }, [leadsComReuniao]);

  function irParaHoje() {
    setCursor(new Date());
    setDiaSelecionado(null);
  }

  function navegar(delta: number) {
    setCursor((c) => {
      const novo = new Date(c);
      if (visao === "mes") novo.setMonth(c.getMonth() + delta);
      else if (visao === "semana") novo.setDate(c.getDate() + delta * 7);
      else novo.setDate(c.getDate() + delta);
      return novo;
    });
  }

  const ano = cursor.getFullYear();
  const mes = cursor.getMonth();
  const hojeIso = iso(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const tituloPeriodo =
    visao === "dia"
      ? `${cursor.getDate()} de ${MESES_NOME[mes]} de ${ano}`
      : visao === "semana"
        ? `Semana de ${MESES_NOME[mes]} de ${ano}`
        : `${MESES_NOME[mes]} de ${ano}`;

  function renderMes() {
    const totalDias = diasDoMes(ano, mes);
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const celulas: (number | null)[] = [...Array(primeiroDiaSemana).fill(null), ...Array.from({ length: totalDias }, (_, i) => i + 1)];

    return (
      <div className="grid grid-cols-7 gap-1.5">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="pb-1 text-center text-[11px] font-semibold text-sand-500">{d}</div>
        ))}
        {celulas.map((dia, i) => {
          if (!dia) return <div key={`vazio-${i}`} />;
          const dataIso = iso(ano, mes, dia);
          const compromissos = porDia.get(dataIso) ?? [];
          const isHoje = dataIso === hojeIso;
          return (
            <button
              key={dataIso}
              type="button"
              onClick={() => setDiaSelecionado(dataIso)}
              className={cn(
                "flex min-h-16 flex-col gap-0.5 rounded-lg border p-1 text-left transition-colors",
                isHoje ? "border-wine-500 bg-wine-50" : "border-sand-200 bg-white hover:bg-sand-50"
              )}
            >
              <span className={cn("text-[11px]", isHoje ? "font-bold text-wine-700" : "text-sand-600")}>{dia}</span>
              {compromissos.slice(0, 2).map((l) => (
                <span key={l.id} className="truncate rounded bg-wine-100 px-1 text-[10px] text-wine-800">{l.nome}</span>
              ))}
              {compromissos.length > 2 && <span className="text-[10px] text-sand-400">+{compromissos.length - 2}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  function renderSemana() {
    const inicioSemana = new Date(cursor);
    inicioSemana.setDate(cursor.getDate() - cursor.getDay());
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicioSemana);
      d.setDate(inicioSemana.getDate() + i);
      return d;
    });

    return (
      <div className="grid grid-cols-7 gap-1.5">
        {dias.map((d) => {
          const dataIso = iso(d.getFullYear(), d.getMonth(), d.getDate());
          const compromissos = porDia.get(dataIso) ?? [];
          const isHoje = dataIso === hojeIso;
          return (
            <div key={dataIso} className={cn("min-h-28 rounded-lg border p-1.5", isHoje ? "border-wine-500 bg-wine-50" : "border-sand-200 bg-white")}>
              <p className={cn("mb-1 text-[11px]", isHoje ? "font-bold text-wine-700" : "text-sand-500")}>
                {DIAS_SEMANA[d.getDay()]} {d.getDate()}
              </p>
              <div className="space-y-1">
                {compromissos.map((l) => <CompromissoItem key={l.id} lead={l} />)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderDia() {
    const dataIso = iso(ano, mes, cursor.getDate());
    const compromissos = porDia.get(dataIso) ?? [];
    return (
      <div className="space-y-1.5">
        {compromissos.map((l) => <CompromissoItem key={l.id} lead={l} />)}
        {compromissos.length === 0 && <p className="py-8 text-center text-xs text-sand-400">Nenhuma reunião marcada nesse dia.</p>}
      </div>
    );
  }

  const compromissosDoDiaSelecionado = diaSelecionado ? porDia.get(diaSelecionado) ?? [] : [];

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Button size="icon" variant="outline" onClick={() => navegar(-1)}><ChevronLeft className="size-4" /></Button>
            <Button size="sm" variant="outline" onClick={irParaHoje}>Hoje</Button>
            <Button size="icon" variant="outline" onClick={() => navegar(1)}><ChevronRight className="size-4" /></Button>
            <p className="ml-2 text-sm font-semibold capitalize text-sand-900">{tituloPeriodo}</p>
          </div>
          <div className="flex gap-1">
            {(["mes", "semana", "dia"] as Visao[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisao(v)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-medium capitalize transition-colors",
                  visao === v ? "border-wine-600 bg-wine-700 text-cream-50" : "border-sand-300 bg-white text-sand-600 hover:bg-sand-100"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {visao === "mes" && renderMes()}
        {visao === "semana" && renderSemana()}
        {visao === "dia" && renderDia()}

        {diaSelecionado && visao === "mes" && (
          <div className="mt-4 rounded-lg border border-sand-200 bg-sand-50 p-3">
            <p className="mb-2 text-xs font-semibold text-sand-700">
              Compromissos em {diaSelecionado.split("-").reverse().join("/")}
            </p>
            <div className="space-y-1.5">
              {compromissosDoDiaSelecionado.map((l) => <CompromissoItem key={l.id} lead={l} />)}
              {compromissosDoDiaSelecionado.length === 0 && <p className="text-xs text-sand-400">Nenhuma reunião marcada.</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
