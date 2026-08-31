"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import type { HistoricoFinanceiro } from "@/lib/types";

const STATUSES: HistoricoFinanceiro["status"][] = ["Pago", "Em aberto", "Atrasado", "Negociado", "Cancelado"];

const SEM_SERVICO = "—";

export function HistoricoFinanceiroFormDialog({
  open,
  onOpenChange,
  clienteId,
  entry,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clienteId: string;
  entry?: HistoricoFinanceiro | null;
}) {
  const servicosPortfolio = useAppStore((s) => s.servicosPortfolio);
  const addHistoricoCliente = useAppStore((s) => s.addHistoricoCliente);
  const updateHistoricoCliente = useAppStore((s) => s.updateHistoricoCliente);

  // The parent remounts this component (via a `key` tied to the entry's id, or a
  // fresh id for "create new") whenever it should show a different record, so
  // plain useState initializers are enough — no effect needed to resync on open.
  const [competencia, setCompetencia] = useState(entry?.competencia ?? new Date().toISOString().slice(0, 7));
  const [servico, setServico] = useState(entry?.servico ?? SEM_SERVICO);
  const [valor, setValor] = useState(entry ? String(entry.valor) : "");
  const [vencimento, setVencimento] = useState(entry?.vencimento ?? new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<HistoricoFinanceiro["status"]>(entry?.status ?? "Em aberto");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valor) return;
    const patch: Omit<HistoricoFinanceiro, "id"> = {
      competencia,
      servico: servico === SEM_SERVICO ? undefined : servico,
      valor: Number(valor) || 0,
      vencimento,
      pagamento: status === "Pago" ? (entry?.pagamento ?? new Date().toISOString().slice(0, 10)) : undefined,
      status,
    };
    if (entry) {
      updateHistoricoCliente(clienteId, entry.id, patch);
    } else {
      addHistoricoCliente(clienteId, { id: `hf-${Date.now()}`, ...patch });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Competência</Label>
              <Input type="month" value={competencia} onChange={(e) => setCompetencia(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Tipo de serviço</Label>
              <Select value={servico} onValueChange={setServico}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_SERVICO}>{SEM_SERVICO}</SelectItem>
                  {servicosPortfolio.map((sp) => (<SelectItem key={sp.id} value={sp.nome}>{sp.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Valor (R$) *</Label>
              <Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} required />
            </div>
            <div>
              <Label className="mb-1 block">Vencimento</Label>
              <Input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as HistoricoFinanceiro["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{entry ? "Salvar alterações" : "Adicionar lançamento"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
