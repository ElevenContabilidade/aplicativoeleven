"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { INDICACAO_STATUS, type Indicacao, type IndicacaoStatus } from "@/lib/types";

export function IndicacaoFormDialog({
  open,
  onOpenChange,
  clienteId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clienteId: string;
}) {
  const addIndicacao = useAppStore((s) => s.addIndicacao);

  const [nomeIndicado, setNomeIndicado] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [contato, setContato] = useState("");
  const [status, setStatus] = useState<IndicacaoStatus>("Novo");
  const [observacao, setObservacao] = useState("");

  function reset() {
    setNomeIndicado(""); setEmpresa(""); setContato(""); setStatus("Novo"); setObservacao("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeIndicado) return;
    const indicacao: Indicacao = {
      id: `ind-${Date.now()}`,
      clienteId,
      nomeIndicado,
      empresa: empresa || undefined,
      contato: contato || undefined,
      status,
      data: new Date().toISOString().slice(0, 10),
      observacao: observacao || undefined,
    };
    addIndicacao(indicacao);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova indicação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Nome do indicado *</Label>
            <Input value={nomeIndicado} onChange={(e) => setNomeIndicado(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Empresa</Label>
              <Input value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Contato</Label>
              <Input value={contato} onChange={(e) => setContato(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as IndicacaoStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INDICACAO_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Observações</Label>
              <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Adicionar indicação</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
