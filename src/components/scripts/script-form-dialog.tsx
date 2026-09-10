"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import type { Script } from "@/lib/types";

export function ScriptFormDialog({
  open,
  onOpenChange,
  script,
  departamentoIdPadrao,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  script?: Script | null;
  /** Departamento pré-selecionado ao criar um script novo (ex: o filtro ativo na listagem). */
  departamentoIdPadrao?: string;
}) {
  const departamentos = useAppStore((s) => s.scriptsDepartamentos);
  const addScript = useAppStore((s) => s.addScript);
  const updateScript = useAppStore((s) => s.updateScript);

  // O pai precisa remontar este componente (via `key` ligada ao id do script,
  // ou "new" pra criar) toda vez que for editar um registro diferente —
  // sem isso, os useState abaixo só leem `script` na primeira montagem e
  // ficam presos nesses valores (em branco) mesmo ao abrir outro script.
  const [departamentoId, setDepartamentoId] = useState(script?.departamentoId ?? departamentoIdPadrao ?? "");
  const [titulo, setTitulo] = useState(script?.titulo ?? "");
  const [mensagem, setMensagem] = useState(script?.mensagem ?? "");

  function reset() {
    setDepartamentoId(departamentoIdPadrao ?? "");
    setTitulo("");
    setMensagem("");
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !departamentoId) return;
    const patch = { departamentoId, titulo: titulo.trim(), mensagem: mensagem.trim() || undefined };
    if (script) {
      updateScript(script.id, patch);
    } else {
      addScript({ id: `script-${Date.now()}`, ...patch });
    }
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{script ? "Editar script" : "Novo script"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Departamento *</Label>
            <Select value={departamentoId} onValueChange={setDepartamentoId}>
              <SelectTrigger><SelectValue placeholder="Escolha o departamento" /></SelectTrigger>
              <SelectContent>
                {departamentos.map((d) => (<SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>))}
              </SelectContent>
            </Select>
            {departamentos.length === 0 && (
              <p className="mt-1 text-[11px] text-status-danger">Crie um departamento primeiro em &ldquo;Gerenciar departamentos&rdquo;.</p>
            )}
          </div>
          <div>
            <Label className="mb-1 block">Título / situação *</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Cliente atrasou o pagamento" required />
          </div>
          <div>
            <Label className="mb-1 block">Mensagem</Label>
            <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={5} placeholder="Texto pronto pra copiar e enviar ao cliente" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
            <Button type="submit" disabled={!departamentoId}>{script ? "Salvar alterações" : "Criar script"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
