"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import type { Contato } from "@/lib/types";

const PAPEIS: Contato["papel"][] = ["Financeiro", "Administrativo", "Sócio", "RH", "Outro"];

export function ContatoFormDialog({
  open,
  onOpenChange,
  clienteId,
  contato,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clienteId: string;
  contato?: Contato | null;
}) {
  const addContato = useAppStore((s) => s.addContato);
  const updateContato = useAppStore((s) => s.updateContato);

  // The parent remounts this component (via a `key` tied to the contato's id, or
  // a fresh id for "create new") whenever it should show a different record, so
  // plain useState initializers are enough — no effect needed to resync on open.
  const [nome, setNome] = useState(contato?.nome ?? "");
  const [papel, setPapel] = useState<Contato["papel"]>(contato?.papel ?? "Financeiro");
  const [telefone, setTelefone] = useState(contato?.telefone ?? "");
  const [email, setEmail] = useState(contato?.email ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    const patch: Omit<Contato, "id"> = {
      nome: nome.trim(),
      papel,
      telefone: telefone || undefined,
      email: email || undefined,
    };
    if (contato) {
      updateContato(clienteId, contato.id, patch);
    } else {
      addContato(clienteId, { id: `ct-${Date.now()}`, ...patch });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{contato ? "Editar contato" : "Novo contato"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Papel</Label>
              <Select value={papel} onValueChange={(v) => setPapel(v as Contato["papel"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAPEIS.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Telefone</Label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{contato ? "Salvar alterações" : "Adicionar contato"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
