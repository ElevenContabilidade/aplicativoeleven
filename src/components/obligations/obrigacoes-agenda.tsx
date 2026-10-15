"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store/app-store";
import { rotinasDepartamentosDoMes, type SetorRotina } from "@/lib/obrigacoes-departamentos";
import type { Obligation, ChecklistStatus } from "@/lib/types";
import type { BadgeTone } from "@/lib/status";
import { formatDate, cn } from "@/lib/utils";

const PENDENTES_MANUAL: Obligation["status"][] = ["A fazer", "Em andamento", "Aguardando informação", "Em atraso"];
const PENDENTES_DEPTO: ChecklistStatus[] = ["Pendente", "Em andamento"];

const SETOR_STYLE: Record<SetorRotina | "Manual", BadgeTone> = {
  Fiscal: "wine",
  Contábil: "info",
  "Departamento Pessoal": "cream",
  MEI: "outline",
  Manual: "neutral",
};

const JANELA_PASSADO_DIAS = 14;
const JANELA_FUTURO_DIAS = 30;

/** Lista cronológica (não grade de calendário) de tudo que vence entre
 * {JANELA_PASSADO_DIAS} dias atrás e {JANELA_FUTURO_DIAS} dias à frente —
 * uma agenda de verdade, dia a dia, diferente da visão mensal em grade que
 * já existe em "Ciclo do mês". Só mostra pendente (o que ainda precisa de
 * atenção), não o histórico do que já foi concluído. */
export function ObrigacoesAgenda() {
  const clients = useAppStore((s) => s.clients);
  const obligations = useAppStore((s) => s.obligations);
  const checklistFiscal = useAppStore((s) => s.checklistFiscal);
  const checklistContabil = useAppStore((s) => s.checklistContabil);
  const checklistPessoal = useAppStore((s) => s.checklistPessoal);
  const checklistMei = useAppStore((s) => s.checklistMei);
  const dispensasRotina = useAppStore((s) => s.dispensasRotina);
  const regrasVencimentoOverride = useAppStore((s) => s.regrasVencimentoOverride);
  const rotinasDesativadas = useAppStore((s) => s.rotinasDesativadas);

  const [clienteFiltro, setClienteFiltro] = useState("Todos");

  const hojeMeiaNoiteMs = new Date(new Date().toDateString()).getTime();
  const inicioIso = new Date(hojeMeiaNoiteMs - JANELA_PASSADO_DIAS * 86400000).toISOString().slice(0, 10);
  const fimIso = new Date(hojeMeiaNoiteMs + JANELA_FUTURO_DIAS * 86400000).toISOString().slice(0, 10);
  const competenciaInicio = inicioIso.slice(0, 7);
  const hojeStrIso = new Date(hojeMeiaNoiteMs).toISOString().slice(0, 10);
  const competenciaHoje = hojeStrIso.slice(0, 7);
  const competenciaFim = fimIso.slice(0, 7);

  const itens = useMemo(() => {
    // A janela pode cruzar até 3 meses-calendário (passado/atual/futuro) —
    // gera as rotinas de cada competência envolvida e junta tudo.
    const competencias = [...new Set([competenciaInicio, competenciaHoje, competenciaFim])];
    const porData = new Map<string, { id: string; clienteId: string; tipo: string; setor: SetorRotina | "Manual"; vencimento: string; pendente: boolean }[]>();

    function empurrar(id: string, clienteId: string, tipo: string, setor: SetorRotina | "Manual", vencimento: string, pendente: boolean) {
      if (vencimento < inicioIso || vencimento > fimIso) return;
      if (!pendente) return;
      if (clienteFiltro !== "Todos" && clienteId !== clienteFiltro) return;
      const lista = porData.get(vencimento) ?? [];
      lista.push({ id, clienteId, tipo, setor, vencimento, pendente });
      porData.set(vencimento, lista);
    }

    for (const o of obligations) {
      empurrar(o.id, o.clienteId, o.tipo, "Manual", o.vencimento, PENDENTES_MANUAL.includes(o.status));
    }
    for (const competencia of competencias) {
      const rotinas = rotinasDepartamentosDoMes(
        clients,
        checklistFiscal,
        checklistContabil,
        checklistPessoal,
        checklistMei,
        competencia,
        dispensasRotina,
        regrasVencimentoOverride,
        rotinasDesativadas
      );
      for (const r of rotinas) {
        if (!r.vencimento) continue;
        empurrar(r.id, r.clienteId, r.tipo, r.setor, r.vencimento, PENDENTES_DEPTO.includes(r.status));
      }
    }

    return [...porData.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [
    obligations,
    clients,
    checklistFiscal,
    checklistContabil,
    checklistPessoal,
    checklistMei,
    competenciaInicio,
    competenciaHoje,
    competenciaFim,
    dispensasRotina,
    regrasVencimentoOverride,
    rotinasDesativadas,
    clienteFiltro,
    inicioIso,
    fimIso,
  ]);

  const DIAS_SEMANA = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-sand-500">
          O que vence de {formatDate(inicioIso)} a {formatDate(fimIso)}, dia a dia — só o que ainda está pendente.
        </p>
        <select
          value={clienteFiltro}
          onChange={(e) => setClienteFiltro(e.target.value)}
          className="h-8 rounded-md border border-sand-300 bg-white px-2 text-xs text-sand-700"
        >
          <option value="Todos">Todos os clientes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.dados.razaoSocial}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {itens.map(([data, lista]) => {
          const d = new Date(data + "T00:00:00");
          const hojeMarcador = data === hojeStrIso;
          const atrasado = data < hojeStrIso;
          return (
            <div key={data}>
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize",
                    hojeMarcador
                      ? "border-wine-600 bg-wine-700 text-cream-50"
                      : atrasado
                        ? "border-status-danger bg-status-danger-bg text-status-danger"
                        : "border-sand-300 bg-white text-sand-600"
                  )}
                >
                  {DIAS_SEMANA[d.getDay()]}, {d.getDate()}/{d.getMonth() + 1}
                  {hojeMarcador && " · hoje"}
                </span>
                <div className="h-px flex-1 bg-sand-200" />
              </div>
              <div className="space-y-1.5">
                {lista.map((item) => {
                  const cliente = clients.find((c) => c.id === item.clienteId);
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-sand-200 bg-white px-3 py-2 text-xs">
                      <span className="flex min-w-0 items-center gap-2">
                        <CalendarClock className="size-3.5 shrink-0 text-wine-500" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-sand-900">{item.tipo}</span>
                          {cliente && (
                            <Link href={`/clientes/${cliente.id}`} className="block truncate text-[11px] text-sand-500 hover:text-wine-700 hover:underline">
                              {cliente.dados.razaoSocial}
                            </Link>
                          )}
                        </span>
                      </span>
                      <Badge variant={SETOR_STYLE[item.setor]} className="shrink-0">{item.setor}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {itens.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sand-400">Nada pendente nesse período.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
