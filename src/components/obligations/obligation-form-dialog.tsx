"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { OBLIGATION_STATUS, type Obligation, type ObligationStatus } from "@/lib/types";

export function ObligationFormDialog({
  open,
  onOpenChange,
  obligation,
  fixedClienteId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** When set, the dialog edits this obligation instead of creating a new one. */
  obligation?: Obligation | null;
  fixedClienteId?: string;
}) {
  const clients = useAppStore((s) => s.clients);
  const team = useAppStore((s) => s.team);
  const addObligation = useAppStore((s) => s.addObligation);
  const updateObligation = useAppStore((s) => s.updateObligation);
  const { userId } = useAuthStore();

  const [clienteId, setClienteId] = useState(obligation?.clienteId ?? fixedClienteId ?? clients[0]?.id ?? "");
  const [tipo, setTipo] = useState(obligation?.tipo ?? "");
  const [competencia, setCompetencia] = useState(obligation?.competencia ?? new Date().toISOString().slice(0, 7));
  const [vencimento, setVencimento] = useState(obligation?.vencimento ?? "");
  const [responsavelId, setResponsavelId] = useState(obligation?.responsavelId ?? userId ?? "");
  const [status, setStatus] = useState<ObligationStatus>(obligation?.status ?? "A fazer");
  const [protocolo, setProtocolo] = useState(obligation?.protocolo ?? "");
  const [observacoes, setObservacoes] = useState(obligation?.observacoes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId || !tipo.trim() || !competencia || !vencimento) return;

    const patch = {
      clienteId,
      tipo: tipo.trim(),
      competencia,
      vencimento,
      responsavelId,
      status,
      protocolo: protocolo.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
    };

    if (obligation) {
      updateObligation(obligation.id, patch);
    } else {
      addObligation({ id: `ob-${Date.now()}`, ...patch });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{obligation ? "Editar obrigação" : "Nova obrigação"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!fixedClienteId && (
            <div>
              <Label className="mb-1 block">Cliente *</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.dados.nomeFantasia ?? c.dados.razaoSocial}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="mb-1 block">Tipo *</Label>
            <Input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Ex.: DAS, DCTFWeb, ISS..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Competência *</Label>
              <Input type="month" value={competencia} onChange={(e) => setCompetencia(e.target.value)} required />
            </div>
            <div>
              <Label className="mb-1 block">Vencimento *</Label>
              <Input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} required />
            </div>
            <div>
              <Label className="mb-1 block">Responsável</Label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {team.filter((m) => m.ativo).map((m) => (<SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ObligationStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OBLIGATION_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Protocolo</Label>
              <Input value={protocolo} onChange={(e) => setProtocolo(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Observações</Label>
              <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{obligation ? "Salvar alterações" : "Cadastrar obrigação"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
