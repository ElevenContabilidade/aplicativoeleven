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

export function RecebimentoFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const clients = useAppStore((s) => s.clients);
  const servicosPortfolio = useAppStore((s) => s.servicosPortfolio);
  const addRecebimento = useAppStore((s) => s.addRecebimento);

  const [clienteId, setClienteId] = useState(clients[0]?.id ?? "");
  const [competencia, setCompetencia] = useState(new Date().toISOString().slice(0, 7));
  const [servico, setServico] = useState(SEM_SERVICO);
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<HistoricoFinanceiro["status"]>("Em aberto");

  function reset() {
    setCompetencia(new Date().toISOString().slice(0, 7));
    setServico(SEM_SERVICO);
    setValor("");
    setVencimento(new Date().toISOString().slice(0, 10));
    setStatus("Em aberto");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId || !valor) return;
    const entry: HistoricoFinanceiro = {
      id: `hf-${Date.now()}`,
      competencia,
      servico: servico === SEM_SERVICO ? undefined : servico,
      valor: Number(valor) || 0,
      vencimento,
      pagamento: status === "Pago" ? new Date().toISOString().slice(0, 10) : undefined,
      status,
    };
    addRecebimento(clienteId, entry);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo recebimento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.dados.nomeFantasia ?? c.dados.razaoSocial}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            <div>
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
            <Button type="submit">Registrar recebimento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
