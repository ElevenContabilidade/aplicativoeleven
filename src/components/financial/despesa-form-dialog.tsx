"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";
import type { DespesaAvulsa } from "@/lib/types";

export function DespesaFormDialog({
  open,
  onOpenChange,
  despesa,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Quando presente, o dialog edita essa despesa em vez de criar uma nova.
   * O pai remonta esse componente (via `key`) a cada abertura. */
  despesa?: DespesaAvulsa | null;
}) {
  const addDespesaAvulsa = useAppStore((s) => s.addDespesaAvulsa);
  const updateDespesaAvulsa = useAppStore((s) => s.updateDespesaAvulsa);

  const [descricao, setDescricao] = useState(despesa?.descricao ?? "");
  const [categoria, setCategoria] = useState(despesa?.categoria ?? "");
  const [valor, setValor] = useState(despesa?.valor.toString() ?? "");
  const [vencimento, setVencimento] = useState(despesa?.vencimento ?? new Date().toISOString().slice(0, 10));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim() || !valor) return;
    const patch = {
      descricao: descricao.trim(),
      categoria: categoria.trim() || undefined,
      valor: Number(valor),
      vencimento,
    };
    if (despesa) {
      updateDespesaAvulsa(despesa.id, patch);
    } else {
      addDespesaAvulsa({ id: `desp-${Date.now()}`, status: "Em aberto", ...patch });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{despesa ? "Editar despesa" : "Nova despesa"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Descrição *</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Aluguel do escritório" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Categoria</Label>
              <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex: Estrutura" />
            </div>
            <div>
              <Label className="mb-1 block">Valor (R$) *</Label>
              <Input type="number" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" required />
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Vencimento *</Label>
              <Input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{despesa ? "Salvar alterações" : "Lançar despesa"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
