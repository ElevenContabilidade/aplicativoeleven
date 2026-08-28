"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import type { Certificado, CertificadoStatus } from "@/lib/types";

const TIPOS: Certificado["tipo"][] = ["e-CPF A1", "e-CNPJ A1", "e-CPF A3", "e-CNPJ A3"];
const STATUSES: CertificadoStatus[] = [
  "Agendamento solicitado",
  "Agendamento realizado",
  "Aguardando validação",
  "Validado",
  "Certificado aprovado",
  "Entregue",
  "Renovação próxima",
  "Vencido",
];

export function CertificadoFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const clients = useAppStore((s) => s.clients);
  const addCertificado = useAppStore((s) => s.addCertificado);
  const { userId } = useAuthStore();

  const [clienteId, setClienteId] = useState(clients[0]?.id ?? "");
  const [tipo, setTipo] = useState<Certificado["tipo"]>("e-CNPJ A1");
  const [documento, setDocumento] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [valor, setValor] = useState("220");
  const [status, setStatus] = useState<CertificadoStatus>("Agendamento solicitado");

  function reset() {
    setTipo("e-CNPJ A1"); setDocumento(""); setDataVencimento(""); setValor("220"); setStatus("Agendamento solicitado");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId || !documento || !dataVencimento) return;
    const certificado: Certificado = {
      id: `cert-${Date.now()}`,
      clienteId,
      documento,
      tipo,
      dataVencimento,
      status,
      valor: Number(valor) || 0,
      responsavelId: userId ?? "u7",
    };
    addCertificado(certificado);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo certificado digital</DialogTitle>
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
              <Label className="mb-1 block">Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as Certificado["tipo"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">CPF/CNPJ *</Label>
              <Input value={documento} onChange={(e) => setDocumento(e.target.value)} required />
            </div>
            <div>
              <Label className="mb-1 block">Vencimento *</Label>
              <Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} required />
            </div>
            <div>
              <Label className="mb-1 block">Valor (R$)</Label>
              <Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as CertificadoStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Cadastrar certificado</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
