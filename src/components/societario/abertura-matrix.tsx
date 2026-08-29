"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
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

const PROCESSO_HEADER_COLOR = "#2F3E20";

// Fatia ETAPAS_ABERTURA_EMPRESA nos mesmos blocos de ETAPAS_ABERTURA_GRUPOS.
// O grupo "Junta Comercial" ganha +1 coluna à frente para o valor do processo (R$).
const GRUPOS_COM_ETAPAS = (() => {
  let offset = 0;
  return ETAPAS_ABERTURA_GRUPOS.map((g, i) => {
    const etapas = ETAPAS_ABERTURA_EMPRESA.slice(offset, offset + g.count);
    offset += g.count;
    return { ...g, etapas, colSpan: i === 0 ? g.count + 1 : g.count };
  });
})();

export function AberturaMatrix({ processos, clients }: { processos: ProcessoSocietario[]; clients: Client[] }) {
  const setEtapaStatus = useAppStore((s) => s.setEtapaStatus);
  const updateProcessoSocietario = useAppStore((s) => s.updateProcessoSocietario);

  return (
    <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white">
      <table className="w-full border-separate border-spacing-0 text-[11px]">
        <thead>
          <tr>
            <th
              colSpan={4}
              className="sticky left-0 z-20 whitespace-nowrap px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: PROCESSO_HEADER_COLOR }}
            >
              Processo
            </th>
            {GRUPOS_COM_ETAPAS.map((g) => (
              <th
                key={g.label}
                colSpan={g.colSpan}
                className="whitespace-nowrap border-l border-white/20 px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-white"
                style={{ backgroundColor: g.color }}
              >
                {g.label}
              </th>
            ))}
          </tr>
          <tr>
            <th className="sticky left-0 z-20 w-40 whitespace-nowrap border-b border-r border-sand-200 bg-wine-800 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-cream-50">
              Cliente
            </th>
            <th className="whitespace-nowrap border-b border-l border-sand-200 bg-sand-50 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-sand-600">
              Nº do processo
            </th>
            <th className="whitespace-nowrap border-b border-l border-sand-200 bg-sand-50 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-sand-600">
              Processo
            </th>
            <th className="whitespace-nowrap border-b border-l border-sand-200 bg-sand-50 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-sand-600">
              Pagamento
            </th>
            <th className="whitespace-nowrap border-b border-l border-sand-200 bg-sand-50 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-sand-600">
              R$ / Valor
            </th>
            {ETAPAS_ABERTURA_EMPRESA.map((etapa) => (
              <th
                key={etapa}
                className="whitespace-nowrap border-b border-l border-sand-200 bg-sand-50 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-sand-600"
              >
                {etapa}
              </th>
            ))}
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
                <td className="border-b border-l border-sand-200 p-0.5">
                  <Input
                    value={p.protocolo ?? ""}
                    onChange={(e) => updateProcessoSocietario(p.id, { protocolo: e.target.value })}
                    placeholder="—"
                    className="h-8 w-28 border-transparent bg-transparent px-1.5 text-[11px] hover:border-sand-300 focus:border-wine-500"
                  />
                </td>
                <td className="border-b border-l border-sand-200 px-2 py-1.5 text-sand-600">{p.tipoServico}</td>
                <td className="border-b border-l border-sand-200 p-0">
                  <Select
                    value={p.pagamento ?? "Pendente"}
                    onValueChange={(v) => updateProcessoSocietario(p.id, { pagamento: v as PagamentoProcesso })}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-9 w-full justify-center gap-1 rounded-none border-0 px-1 text-[10px] font-bold uppercase text-white [&_svg]:text-white/70",
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
                </td>
                <td className="border-b border-l border-sand-200 p-0.5">
                  <Input
                    type="number"
                    value={p.valorProcesso ?? ""}
                    onChange={(e) => updateProcessoSocietario(p.id, { valorProcesso: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="h-8 w-20 border-transparent bg-transparent px-1.5 text-[11px] hover:border-sand-300 focus:border-wine-500"
                  />
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
              <td colSpan={ETAPAS_ABERTURA_EMPRESA.length + 5} className="py-8 text-center text-sand-400">
                Nenhum processo de abertura de empresa com checklist neste ano.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
