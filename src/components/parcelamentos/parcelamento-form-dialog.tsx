"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { maskCnpjCpf } from "@/lib/cnpj";
import type { Parcelamento, StatusEnvioParcelamento } from "@/lib/types";

export function ParcelamentoFormDialog({
  open,
  onOpenChange,
  parcelamento,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  parcelamento?: Parcelamento;
}) {
  const addParcelamento = useAppStore((s) => s.addParcelamento);
  const updateParcelamento = useAppStore((s) => s.updateParcelamento);
  const setEnvioParcelamento = useAppStore((s) => s.setEnvioParcelamento);

  const isEdit = !!parcelamento;
  const today = new Date().toISOString().slice(0, 10);

  const [clienteNome, setClienteNome] = useState(parcelamento?.clienteNome ?? "");
  const [cnpjCpf, setCnpjCpf] = useState(parcelamento?.cnpjCpf ?? "");
  const [nome, setNome] = useState(parcelamento?.nome ?? "");
  const [quantidadeParcelas, setQuantidadeParcelas] = useState(
    parcelamento?.quantidadeParcelas ? String(parcelamento.quantidadeParcelas) : ""
  );
  const [dataInicio, setDataInicio] = useState(parcelamento?.dataInicio ?? today);
  const [statusInicial, setStatusInicial] = useState<StatusEnvioParcelamento>("Não enviado");
  const [observacoes, setObservacoes] = useState(parcelamento?.observacoes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteNome.trim() || !nome.trim() || !dataInicio) return;

    const patch = {
      clienteNome: clienteNome.trim(),
      cnpjCpf: cnpjCpf.trim() || undefined,
      nome: nome.trim(),
      quantidadeParcelas: quantidadeParcelas ? Number(quantidadeParcelas) : undefined,
      dataInicio,
      observacoes: observacoes || undefined,
    };

    if (isEdit) {
      updateParcelamento(parcelamento.id, patch);
    } else {
      const id = `pc-${Date.now()}`;
      addParcelamento({ id, criadoEm: today, ...patch });
      setEnvioParcelamento(id, dataInicio.slice(0, 7), statusInicial);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar parcelamento" : "Novo parcelamento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Cliente *</Label>
              <Input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Nome do cliente" required />
            </div>
            <div>
              <Label className="mb-1 block">CNPJ/CPF</Label>
              <Input value={cnpjCpf} onChange={(e) => setCnpjCpf(maskCnpjCpf(e.target.value))} placeholder="CNPJ ou CPF do cliente" />
              <p className="mt-1 text-[11px] text-sand-500">Usado para identificar automaticamente o cliente no perfil dele.</p>
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Nome do parcelamento *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Parcelamento Simples Nacional 2026" required />
            </div>
            <div>
              <Label className="mb-1 block">Data de início *</Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} min="2026-01-01" max="2034-12-31" required />
              <p className="mt-1 text-[11px] text-sand-500">Mês/ano da 1ª parcela.</p>
            </div>
            <div>
              <Label className="mb-1 block">Em quantas X</Label>
              <Input type="number" min="1" step="1" value={quantidadeParcelas} onChange={(e) => setQuantidadeParcelas(e.target.value)} placeholder="Ex: 12" />
              <p className="mt-1 text-[11px] text-sand-500">O parcelamento se repete nos meses seguintes.</p>
            </div>
            {!isEdit && (
              <div className="col-span-2">
                <Label className="mb-1 block">Enviado? (1ª parcela)</Label>
                <Select value={statusInicial} onValueChange={(v) => setStatusInicial(v as StatusEnvioParcelamento)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Não enviado">Não enviado</SelectItem>
                    <SelectItem value="Enviado">Enviado</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-sand-500">
                  As próximas parcelas nascem como &ldquo;Não enviado&rdquo; — marque cada uma na tabela conforme for enviando.
                </p>
              </div>
            )}
          </div>

          <div>
            <Label className="mb-1 block">Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{isEdit ? "Salvar alterações" : "Criar parcelamento"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
