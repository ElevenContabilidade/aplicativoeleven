"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { LICENCA_STATUS, type Licenca, type LicencaStatus } from "@/lib/types";

export function LicencaFormDialog({
  open,
  onOpenChange,
  clienteId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clienteId: string;
}) {
  const addLicenca = useAppStore((s) => s.addLicenca);

  const [nome, setNome] = useState("");
  const [status, setStatus] = useState<LicencaStatus>("Regular");
  const [dataEmissao, setDataEmissao] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [observacao, setObservacao] = useState("");

  function reset() {
    setNome(""); setStatus("Regular"); setDataEmissao(""); setDataVencimento(""); setObservacao("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !dataVencimento) return;
    const licenca: Licenca = {
      id: `lic-${Date.now()}`,
      clienteId,
      nome,
      status,
      dataEmissao: dataEmissao || undefined,
      dataVencimento,
      observacao: observacao || undefined,
    };
    addLicenca(licenca);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova licença ou registro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Nome *</Label>
            <Input placeholder="Ex.: Alvará de Funcionamento" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Data de emissão</Label>
              <Input type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Data de vencimento *</Label>
              <Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} required />
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as LicencaStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LICENCA_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
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
            <Button type="submit">Adicionar licença</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
