"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Lead } from "@/lib/types";
import { teamName } from "@/lib/data/seed";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/lib/store/app-store";
import { createClientFromLead } from "@/lib/actions/convert-lead";

export function LeadDetailDialog({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const router = useRouter();
  const addClient = useAppStore((s) => s.addClient);
  const clients = useAppStore((s) => s.clients);
  const alreadyClient = lead ? clients.some((c) => c.leadOrigemId === lead.id) : false;

  if (!lead) return null;

  function handleConvert() {
    if (!lead) return;
    const client = createClientFromLead(lead);
    addClient(client);
    onClose();
    router.push(`/clientes/${client.id}`);
  }

  return (
    <Dialog open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{lead.nome}</DialogTitle>
            <StatusBadge status={lead.stage} />
          </div>
          <p className="text-xs text-sand-500">{lead.empresa}</p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <Info label="Telefone" value={lead.telefone} />
          <Info label="E-mail" value={lead.email ?? "—"} />
          <Info label="Cidade/UF" value={`${lead.cidade}/${lead.estado}`} />
          <Info label="Origem" value={lead.origem} />
          <Info label="Segmento" value={lead.segmento ?? "—"} />
          <Info label="Regime atual" value={lead.regimeTributarioAtual ?? "—"} />
          <Info label="Faturamento estimado" value={lead.faturamentoEstimado ? formatCurrency(lead.faturamentoEstimado) : "—"} />
          <Info label="Valor estimado" value={formatCurrency(lead.valorEstimado)} />
          <Info label="Responsável" value={teamName(lead.responsavelId)} />
          <Info label="Próxima ação" value={lead.proximaAcao ?? "—"} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {lead.servicosInteresse.map((s) => (
            <Badge key={s} variant="cream">
              {s}
            </Badge>
          ))}
        </div>

        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold text-sand-700">Histórico</p>
          <div className="max-h-40 space-y-2 overflow-y-auto scrollbar-thin">
            <div className="text-[11px] text-sand-500">
              <span className="font-medium text-sand-700">{formatDate(lead.dataEntrada)}</span> — Lead cadastrado
            </div>
            {lead.historico.map((h) => (
              <div key={h.id} className="text-[11px] text-sand-500">
                <span className="font-medium text-sand-700">{formatDateTime(h.data)}</span> — {h.autor}: {h.descricao}
              </div>
            ))}
            {lead.historico.length === 0 && <p className="text-[11px] text-sand-400">Sem movimentações registradas ainda.</p>}
          </div>
        </div>

        <DialogFooter>
          {lead.stage === "Fechado" && !alreadyClient && (
            <Button onClick={handleConvert}>Converter em cliente</Button>
          )}
          {alreadyClient && (
            <Button variant="secondary" onClick={() => router.push(`/clientes/${clients.find((c) => c.leadOrigemId === lead.id)?.id}`)}>
              Ver cliente
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-sand-400">{label}</p>
      <p className="font-medium text-sand-800">{value}</p>
    </div>
  );
}
