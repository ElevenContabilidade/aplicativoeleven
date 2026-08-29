"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import {
  CHECKLIST_STATUS,
  ETAPAS_ABERTURA_EMPRESA,
  ETAPAS_ABERTURA_GRUPOS,
  type ChecklistStatus,
  type Client,
  type PagamentoProcesso,
  type ProcessoSocietario,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const CELL_STATUS_STYLE: Record<ChecklistStatus, string> = {
  OK: "bg-status-success",
  Pendente: "bg-status-danger",
  "Em andamento": "bg-status-warning",
  Dispensada: "bg-status-brown",
};

const PAGAMENTO_OPCOES: PagamentoProcesso[] = ["Pago", "Pendente"];
const PAGAMENTO_STYLE: Record<PagamentoProcesso, string> = {
  Pago: "bg-status-success",
  Pendente: "bg-status-danger",
};

function isDone(status: ChecklistStatus) {
  return status === "OK" || status === "Dispensada";
}

// Fatia ETAPAS_ABERTURA_EMPRESA nos mesmos blocos de ETAPAS_ABERTURA_GRUPOS.
const GRUPOS_COM_ETAPAS = (() => {
  let offset = 0;
  return ETAPAS_ABERTURA_GRUPOS.map((g) => {
    const etapas = ETAPAS_ABERTURA_EMPRESA.slice(offset, offset + g.count);
    offset += g.count;
    return { ...g, etapas };
  });
})();

export function AberturaMatrix({ processos, clients }: { processos: ProcessoSocietario[]; clients: Client[] }) {
  const setEtapaStatus = useAppStore((s) => s.setEtapaStatus);
  const updateProcessoSocietario = useAppStore((s) => s.updateProcessoSocietario);
  const [openId, setOpenId] = useState<string | null>(processos[0]?.id ?? null);

  if (processos.length === 0) {
    return (
      <div className="rounded-2xl border border-sand-200 bg-white py-10 text-center text-sand-400">
        Nenhum processo de abertura de empresa com checklist neste ano.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {processos.map((p) => {
        const client = clients.find((c) => c.id === p.clienteId);
        const total = ETAPAS_ABERTURA_EMPRESA.length;
        const feitas = p.etapas.filter((e) => isDone(e.status)).length;
        const pct = total > 0 ? Math.round((feitas / total) * 100) : 0;
        const open = openId === p.id;

        return (
          <div key={p.id} className="overflow-hidden rounded-2xl border border-sand-200 bg-white">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : p.id)}
              className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-sand-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ChevronDown className={cn("size-4 shrink-0 text-sand-400 transition-transform", open && "rotate-180")} />
                <div className="min-w-0">
                  <Link
                    href={`/clientes/${p.clienteId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold text-sand-800 hover:text-wine-700 hover:underline"
                  >
                    {client?.dados.nomeFantasia ?? client?.dados.razaoSocial ?? "—"}
                  </Link>
                  <p className="text-xs text-sand-500">
                    {p.tipoServico}
                    {p.protocolo ? ` · Nº ${p.protocolo}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-5" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-sand-400">Nº processo</span>
                  <Input
                    value={p.protocolo ?? ""}
                    onChange={(e) => updateProcessoSocietario(p.id, { protocolo: e.target.value })}
                    placeholder="—"
                    className="h-8 w-28 text-[12px]"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-sand-400">Pagamento</span>
                  <Select
                    value={p.pagamento ?? "Pendente"}
                    onValueChange={(v) => updateProcessoSocietario(p.id, { pagamento: v as PagamentoProcesso })}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-8 w-28 justify-center gap-1 border-0 px-2 text-[11px] font-bold uppercase text-white [&_svg]:text-white/70",
                        PAGAMENTO_STYLE[p.pagamento ?? "Pendente"]
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGAMENTO_OPCOES.map((s) => (
                        <SelectItem key={s} value={s} className="uppercase">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-sand-400">R$</span>
                  <Input
                    type="number"
                    value={p.valorProcesso ?? ""}
                    onChange={(e) => updateProcessoSocietario(p.id, { valorProcesso: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="h-8 w-20 text-[12px]"
                  />
                </div>

                <div className="flex w-32 shrink-0 items-center gap-2">
                  <Progress value={pct} className="h-1.5" />
                  <span className="w-10 shrink-0 text-right text-xs font-semibold text-sand-600">{pct}%</span>
                </div>
              </div>
            </button>

            {open && (
              <div className="space-y-4 border-t border-sand-200 bg-sand-50/40 p-4">
                {GRUPOS_COM_ETAPAS.map((g) => (
                  <div key={g.label}>
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                        style={{ backgroundColor: g.color }}
                      >
                        {g.label}
                      </span>
                      <span className="text-[11px] text-sand-400">
                        {g.etapas.filter((descricao) => {
                          const etapa = p.etapas.find((e) => e.descricao === descricao);
                          return etapa && isDone(etapa.status);
                        }).length}
                        /{g.etapas.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {g.etapas.map((descricao) => {
                        const etapa = p.etapas.find((e) => e.descricao === descricao);
                        return (
                          <div
                            key={descricao}
                            className="flex items-center justify-between gap-2 rounded-lg border border-sand-200 bg-white py-1 pl-3 pr-1"
                          >
                            <span className="min-w-0 flex-1 truncate text-[12px] text-sand-700" title={descricao}>
                              {descricao}
                            </span>
                            {etapa ? (
                              <Select value={etapa.status} onValueChange={(v) => setEtapaStatus(p.id, etapa.id, v as ChecklistStatus)}>
                                <SelectTrigger
                                  className={cn(
                                    "h-7 w-32 shrink-0 justify-center gap-1 border-0 px-1 text-[10px] font-bold uppercase text-white [&_svg]:text-white/70",
                                    CELL_STATUS_STYLE[etapa.status]
                                  )}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CHECKLIST_STATUS.map((s) => (
                                    <SelectItem key={s} value={s} className="uppercase">{s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="shrink-0 px-2 text-[11px] text-sand-300">—</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
