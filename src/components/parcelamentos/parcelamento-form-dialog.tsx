"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { TIPOS_PARCELAMENTO_PADRAO, type Parcelamento, type StatusEnvioParcelamento } from "@/lib/types";

export function ParcelamentoFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const clients = useAppStore((s) => s.clients);
  const parcelamentos = useAppStore((s) => s.parcelamentos);
  const addParcelamento = useAppStore((s) => s.addParcelamento);

  const [clienteNome, setClienteNome] = useState("");
  const [tipo, setTipo] = useState<string>(TIPOS_PARCELAMENTO_PADRAO[0]);
  const [competencia, setCompetencia] = useState(new Date().toISOString().slice(0, 7));
  const [status, setStatus] = useState<StatusEnvioParcelamento>("Não enviado");
  const [observacoes, setObservacoes] = useState("");

  const tipoOptions = useMemo(() => {
    const usados = parcelamentos.map((p) => p.tipo);
    return [...new Set([...TIPOS_PARCELAMENTO_PADRAO, ...usados])];
  }, [parcelamentos]);

  function reset() {
    setClienteNome("");
    setTipo(TIPOS_PARCELAMENTO_PADRAO[0]);
    setCompetencia(new Date().toISOString().slice(0, 7));
    setStatus("Não enviado");
    setObservacoes("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteNome.trim() || !tipo.trim()) return;
    const parcelamento: Parcelamento = {
      id: `pc-${Date.now()}`,
      clienteNome: clienteNome.trim(),
      tipo: tipo.trim(),
      competencia,
      status,
      observacoes: observacoes || undefined,
      criadoEm: new Date().toISOString().slice(0, 10),
    };
    addParcelamento(parcelamento);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo parcelamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Cliente *</Label>
            <Input
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Nome do cliente"
              list="parcelamento-clientes"
              required
            />
            <datalist id="parcelamento-clientes">
              {clients.map((c) => (
                <option key={c.id} value={c.dados.nomeFantasia ?? c.dados.razaoSocial} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="mb-1 block">Tipo de parcelamento *</Label>
              <Input
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                placeholder="Ex: Parcelamento Simples Nacional"
                list="parcelamento-tipos"
                required
              />
              <datalist id="parcelamento-tipos">
                {tipoOptions.map((t) => (<option key={t} value={t} />))}
              </datalist>
            </div>
            <div>
              <Label className="mb-1 block">Competência</Label>
              <Input type="month" value={competencia} onChange={(e) => setCompetencia(e.target.value)} min="2026-01" max="2034-12" />
              <p className="mt-1 text-[11px] text-sand-500">Define em que mês/ano entra nos filtros.</p>
            </div>
            <div>
              <Label className="mb-1 block">Enviado?</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as StatusEnvioParcelamento)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Não enviado">Não enviado</SelectItem>
                  <SelectItem value="Enviado">Enviado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-1 block">Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Criar parcelamento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
