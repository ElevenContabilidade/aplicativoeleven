"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";

export function GerenciarDepartamentosDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const departamentos = useAppStore((s) => s.scriptsDepartamentos);
  const scripts = useAppStore((s) => s.scripts);
  const addScriptDepartamento = useAppStore((s) => s.addScriptDepartamento);
  const updateScriptDepartamento = useAppStore((s) => s.updateScriptDepartamento);
  const deleteScriptDepartamento = useAppStore((s) => s.deleteScriptDepartamento);

  const [novoNome, setNovoNome] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoNome, setEditandoNome] = useState("");

  function handleAdicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!novoNome.trim()) return;
    addScriptDepartamento({ id: `scr-dep-${Date.now()}`, nome: novoNome.trim() });
    setNovoNome("");
  }

  function iniciarEdicao(id: string, nomeAtual: string) {
    setEditandoId(id);
    setEditandoNome(nomeAtual);
  }

  function salvarEdicao() {
    if (editandoId && editandoNome.trim()) updateScriptDepartamento(editandoId, { nome: editandoNome.trim() });
    setEditandoId(null);
  }

  function handleExcluir(id: string, nome: string) {
    const qtd = scripts.filter((s) => s.departamentoId === id).length;
    const aviso = qtd > 0 ? ` Isso também exclui os ${qtd} script(s) desse departamento.` : "";
    if (!confirm(`Excluir o departamento "${nome}"?${aviso}`)) return;
    deleteScriptDepartamento(id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar departamentos</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          {departamentos.map((d) => (
            <div key={d.id} className="flex items-center gap-2 rounded-lg border border-sand-100 px-3 py-2">
              {editandoId === d.id ? (
                <>
                  <Input value={editandoNome} onChange={(e) => setEditandoNome(e.target.value)} className="h-8 flex-1" autoFocus />
                  <button type="button" onClick={salvarEdicao} className="text-status-success"><Check className="size-4" /></button>
                  <button type="button" onClick={() => setEditandoId(null)} className="text-sand-400"><X className="size-4" /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-sand-800">{d.nome}</span>
                  <button type="button" onClick={() => iniciarEdicao(d.id, d.nome)} className="text-sand-400 hover:text-sand-700">
                    <Pencil className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => handleExcluir(d.id, d.nome)} className="text-sand-400 hover:text-status-danger">
                    <Trash2 className="size-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
          {departamentos.length === 0 && <p className="py-4 text-center text-xs text-sand-400">Nenhum departamento ainda.</p>}
        </div>
        <form onSubmit={handleAdicionar} className="flex items-center gap-2 border-t border-sand-100 pt-3">
          <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Novo departamento" className="h-8 flex-1" />
          <Button type="submit" size="sm" variant="outline"><Plus className="size-3.5" /></Button>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
