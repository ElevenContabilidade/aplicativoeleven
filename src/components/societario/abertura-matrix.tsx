"use client";

import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { CHECKLIST_STATUS, ETAPAS_ABERTURA_EMPRESA, ETAPAS_ABERTURA_GRUPOS, type ChecklistStatus, type Client, type ProcessoSocietario } from "@/lib/types";
import { cn } from "@/lib/utils";

const CELL_STATUS_STYLE: Record<ChecklistStatus, string> = {
  OK: "bg-status-success",
  Pendente: "bg-status-danger",
  "Em andamento": "bg-status-warning",
  Dispensada: "bg-status-brown",
};

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

  return (
    <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white">
      <table className="w-full border-separate border-spacing-0 text-[11px]">
        <thead>
          <tr>
            <th
              rowSpan={2}
              className="sticky left-0 z-20 w-44 whitespace-nowrap border-b border-r border-sand-200 bg-wine-800 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-cream-50"
            >
              Cliente
            </th>
            {GRUPOS_COM_ETAPAS.map((g) => (
              <th
                key={g.label}
                colSpan={g.etapas.length}
                className="whitespace-nowrap border-b border-l border-white/20 px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-white"
                style={{ backgroundColor: g.color }}
              >
                {g.label}
              </th>
            ))}
          </tr>
          <tr>
            {GRUPOS_COM_ETAPAS.flatMap((g) =>
              g.etapas.map((etapa) => (
                <th
                  key={etapa}
                  className="whitespace-nowrap border-b border-l border-sand-200 bg-sand-50 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-sand-600"
                >
                  {etapa}
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {processos.map((p) => {
            const client = clients.find((c) => c.id === p.clienteId);
            return (
              <tr key={p.id} className="odd:bg-sand-50/40">
                <td className="sticky left-0 z-10 whitespace-nowrap border-b border-r border-sand-200 bg-inherit px-3 py-1.5 font-medium text-sand-800">
                  <Link href={`/clientes/${p.clienteId}`} className="hover:text-wine-700 hover:underline">
                    {client?.dados.nomeFantasia ?? client?.dados.razaoSocial ?? "—"}
                  </Link>
                </td>
                {ETAPAS_ABERTURA_EMPRESA.map((descricao) => {
                  const etapa = p.etapas.find((e) => e.descricao === descricao);
                  if (!etapa) {
                    return <td key={descricao} className="border-b border-l border-sand-200 bg-sand-50 text-center text-sand-300">—</td>;
                  }
                  return (
                    <td key={descricao} className="border-b border-l border-sand-200 p-0">
                      <Select value={etapa.status} onValueChange={(v) => setEtapaStatus(p.id, etapa.id, v as ChecklistStatus)}>
                        <SelectTrigger
                          className={cn(
                            "h-9 w-full justify-center gap-1 rounded-none border-0 px-1 text-[10px] font-bold uppercase text-white [&_svg]:text-white/70",
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
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {processos.length === 0 && (
            <tr>
              <td colSpan={ETAPAS_ABERTURA_EMPRESA.length + 1} className="py-8 text-center text-sand-400">
                Nenhum processo de abertura de empresa com checklist neste ano.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
