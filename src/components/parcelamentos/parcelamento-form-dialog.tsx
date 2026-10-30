"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { maskCnpjCpf } from "@/lib/cnpj";
import type { Parcelamento, StatusEnvioParcelamento } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const clients = useAppStore((s) => s.clients);

  const isEdit = !!parcelamento;
  const today = new Date().toISOString().slice(0, 10);

  const clientesOrdenados = useMemo(
    () => [...clients].sort((a, b) => a.dados.razaoSocial.localeCompare(b.dados.razaoSocial, "pt-BR")),
    [clients]
  );

  const [clienteMode, setClienteMode] = useState<"existente" | "avulso">(parcelamento?.clienteId ? "existente" : "avulso");
  const [clienteId, setClienteId] = useState(parcelamento?.clienteId ?? clientesOrdenados[0]?.id ?? "");
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
    if (clienteMode === "existente" ? !clienteId : !clienteNome.trim()) return;
    if (!nome.trim() || !dataInicio) return;

    const clienteSelecionado = clienteMode === "existente" ? clientesOrdenados.find((c) => c.id === clienteId) : undefined;

    const patch = {
      clienteId: clienteSelecionado?.id,
      clienteNome: clienteSelecionado ? clienteSelecionado.dados.razaoSocial : clienteNome.trim(),
      cnpjCpf: (clienteSelecionado ? clienteSelecionado.dados.cnpj : cnpjCpf.trim()) || undefined,
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
          <div>
            <Label className="mb-1 block">Cliente *</Label>
            <div className="mb-2 inline-flex rounded-lg border border-sand-200 bg-sand-50 p-0.5">
              <button
                type="button"
                onClick={() => setClienteMode("existente")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  clienteMode === "existente" ? "bg-white text-wine-700 shadow-sm" : "text-sand-500 hover:text-sand-700"
                )}
              >
                Cliente já cadastrado
              </button>
              <button
                type="button"
                onClick={() => setClienteMode("avulso")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  clienteMode === "avulso" ? "bg-white text-wine-700 shadow-sm" : "text-sand-500 hover:text-sand-700"
                )}
              >
                Nome avulso
              </button>
            </div>
            {clienteMode === "existente" ? (
              <div>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientesOrdenados.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.dados.razaoSocial}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-sand-500">
                  Fica vinculado direto ao cadastro do cliente — aparece no perfil dele em Parcelamentos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Nome do cliente" required />
                <Input value={cnpjCpf} onChange={(e) => setCnpjCpf(maskCnpjCpf(e.target.value))} placeholder="CNPJ ou CPF (opcional)" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
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
