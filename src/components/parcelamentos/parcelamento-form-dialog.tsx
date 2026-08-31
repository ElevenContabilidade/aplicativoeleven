"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { maskCnpj } from "@/lib/cnpj";
import { TIPOS_PARCELAMENTO_PADRAO, type Parcelamento, type StatusEnvioParcelamento } from "@/lib/types";

export function ParcelamentoFormDialog({
  open,
  onOpenChange,
  parcelamento,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  parcelamento?: Parcelamento;
}) {
  const parcelamentos = useAppStore((s) => s.parcelamentos);
  const addParcelamento = useAppStore((s) => s.addParcelamento);
  const updateParcelamento = useAppStore((s) => s.updateParcelamento);

  const isEdit = !!parcelamento;
  const today = new Date().toISOString().slice(0, 10);

  const [clienteNome, setClienteNome] = useState(parcelamento?.clienteNome ?? "");
  const [cnpj, setCnpj] = useState(parcelamento?.cnpj ?? "");
  const [nome, setNome] = useState(parcelamento?.nome ?? "");
  const [tipo, setTipo] = useState<string>(parcelamento?.tipo ?? TIPOS_PARCELAMENTO_PADRAO[0]);
  const [quantidadeParcelas, setQuantidadeParcelas] = useState(
    parcelamento?.quantidadeParcelas ? String(parcelamento.quantidadeParcelas) : ""
  );
  const [dataInicio, setDataInicio] = useState(parcelamento?.dataInicio ?? today);
  const [status, setStatus] = useState<StatusEnvioParcelamento>(parcelamento?.status ?? "Não enviado");
  const [observacoes, setObservacoes] = useState(parcelamento?.observacoes ?? "");

  const tipoOptions = useMemo(() => {
    const usados = parcelamentos.map((p) => p.tipo);
    return [...new Set([...TIPOS_PARCELAMENTO_PADRAO, ...usados])];
  }, [parcelamentos]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteNome.trim() || !nome.trim() || !tipo.trim() || !dataInicio) return;

    const patch = {
      clienteNome: clienteNome.trim(),
      cnpj: cnpj.trim() || undefined,
      nome: nome.trim(),
      tipo: tipo.trim(),
      quantidadeParcelas: quantidadeParcelas ? Number(quantidadeParcelas) : undefined,
      dataInicio,
      status,
      observacoes: observacoes || undefined,
    };

    if (isEdit) {
      updateParcelamento(parcelamento.id, patch);
    } else {
      addParcelamento({ id: `pc-${Date.now()}`, criadoEm: today, ...patch });
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
              <Label className="mb-1 block">CNPJ</Label>
              <Input value={cnpj} onChange={(e) => setCnpj(maskCnpj(e.target.value))} placeholder="00.000.000/0000-00" />
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Nome do parcelamento *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Simples Nacional 2026" required />
            </div>
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
              <Label className="mb-1 block">Data de início *</Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} min="2026-01-01" max="2034-12-31" required />
              <p className="mt-1 text-[11px] text-sand-500">Define em que ano/mês entra nos filtros.</p>
            </div>
            <div>
              <Label className="mb-1 block">Em quantas X</Label>
              <Input type="number" min="1" step="1" value={quantidadeParcelas} onChange={(e) => setQuantidadeParcelas(e.target.value)} placeholder="Ex: 12" />
            </div>
            <div className="col-span-2">
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
            <Button type="submit">{isEdit ? "Salvar alterações" : "Criar parcelamento"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
