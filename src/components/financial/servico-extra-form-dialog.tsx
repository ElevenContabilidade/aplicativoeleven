"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import type { ServicoExtra } from "@/lib/types";

const STATUSES: ServicoExtra["status"][] = ["Pago", "Em aberto", "Atrasado", "Negociado", "Cancelado"];

export function ServicoExtraFormDialog({
  open,
  onOpenChange,
  servicoExtra,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  servicoExtra?: ServicoExtra | null;
}) {
  const clients = useAppStore((s) => s.clients);
  const team = useAppStore((s) => s.team);
  const addServicoExtra = useAppStore((s) => s.addServicoExtra);
  const updateServicoExtra = useAppStore((s) => s.updateServicoExtra);
  const { userId } = useAuthStore();

  const isEdit = !!servicoExtra;
  const today = new Date().toISOString().slice(0, 10);

  const clientesOrdenados = useMemo(
    () => [...clients].sort((a, b) => a.dados.razaoSocial.localeCompare(b.dados.razaoSocial, "pt-BR")),
    [clients]
  );

  const [clienteId, setClienteId] = useState(servicoExtra?.clienteId ?? clientesOrdenados[0]?.id ?? "");
  const [servico, setServico] = useState(servicoExtra?.servico ?? "");
  const [valor, setValor] = useState(servicoExtra?.valor ? String(servicoExtra.valor) : "");
  const [responsavelId, setResponsavelId] = useState(servicoExtra?.responsavelId ?? userId ?? team[0]?.id ?? "");
  const [data, setData] = useState(servicoExtra?.data ?? today);
  const [status, setStatus] = useState<ServicoExtra["status"]>(servicoExtra?.status ?? "Em aberto");

  function reset() {
    setClienteId(clientesOrdenados[0]?.id ?? "");
    setServico("");
    setValor("");
    setResponsavelId(userId ?? team[0]?.id ?? "");
    setData(today);
    setStatus("Em aberto");
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId || !servico.trim() || !data) return;
    const valorNumero = Number(valor.replace(",", ".")) || 0;

    if (isEdit) {
      updateServicoExtra(servicoExtra.id, { clienteId, servico: servico.trim(), valor: valorNumero, responsavelId, data, status });
    } else {
      addServicoExtra({
        id: `se-${Date.now()}`,
        clienteId,
        servico: servico.trim(),
        valor: valorNumero,
        responsavelId,
        data,
        status,
      });
    }
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar serviço extra" : "Novo serviço extra"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Cliente *</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent>
                {clientesOrdenados.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.dados.razaoSocial}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block">Serviço *</Label>
            <Input value={servico} onChange={(e) => setServico(e.target.value)} placeholder="Ex: Retificação de declaração" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Valor (R$)</Label>
              <Input type="number" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <Label className="mb-1 block">Data *</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
            </div>
            <div>
              <Label className="mb-1 block">Responsável</Label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {team.map((m) => (<SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ServicoExtra["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
            <Button type="submit">{isEdit ? "Salvar alterações" : "Adicionar serviço"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
