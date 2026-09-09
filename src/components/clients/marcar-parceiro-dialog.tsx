"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/lib/store/app-store";
import type { DepartamentoChave } from "@/lib/types";

const SETORES: { value: DepartamentoChave; label: string }[] = [
  { value: "fiscal", label: "Fiscal" },
  { value: "contabil", label: "Contábil" },
  { value: "pessoal", label: "Departamento Pessoal" },
];

export function MarcarParceiroDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const clients = useAppStore((s) => s.clients);
  const marcarClientesParceiro = useAppStore((s) => s.marcarClientesParceiro);

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [nomeParceiro, setNomeParceiro] = useState("");
  const [setores, setSetores] = useState<DepartamentoChave[]>([]);
  const [aplicado, setAplicado] = useState<number | null>(null);

  function reset() {
    setSearch("");
    setSelectedIds(new Set());
    setNomeParceiro("");
    setSetores([]);
    setAplicado(null);
  }

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.dados.razaoSocial.toLowerCase().includes(q) ||
        (c.dados.nomeFantasia ?? "").toLowerCase().includes(q) ||
        c.dados.cnpj.includes(q)
    );
  }, [clients, search]);

  function toggleCliente(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleTodosFiltrados() {
    const todosSelecionados = filtrados.length > 0 && filtrados.every((c) => selectedIds.has(c.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const c of filtrados) {
        if (todosSelecionados) next.delete(c.id); else next.add(c.id);
      }
      return next;
    });
  }

  function toggleSetor(setor: DepartamentoChave) {
    setSetores((prev) => (prev.includes(setor) ? prev.filter((s) => s !== setor) : [...prev, setor]));
  }

  function handleAplicar() {
    if (selectedIds.size === 0 || !nomeParceiro.trim() || setores.length === 0) return;
    marcarClientesParceiro([...selectedIds], nomeParceiro.trim(), setores);
    setAplicado(selectedIds.size);
    setSelectedIds(new Set());
  }

  const todosFiltradosSelecionados = filtrados.length > 0 && filtrados.every((c) => selectedIds.has(c.id));

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Marcar clientes de parceiro</DialogTitle>
        </DialogHeader>

        {aplicado !== null ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 className="size-8 text-status-success" />
            <p className="text-sm font-medium text-sand-800">
              {aplicado} cliente{aplicado === 1 ? "" : "s"} marcado{aplicado === 1 ? "" : "s"} como parceiro.
            </p>
            <p className="text-xs text-sand-500">
              Eles só entram a partir de agora nos checklists dos setores marcados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Nome do parceiro</Label>
                <Input value={nomeParceiro} onChange={(e) => setNomeParceiro(e.target.value)} placeholder="Ex: Contabilidade Vitória" />
              </div>
              <div>
                <Label className="mb-1 block">Setores atendidos pela Eleven</Label>
                <div className="flex flex-wrap gap-3 pt-1.5">
                  {SETORES.map((s) => (
                    <label key={s.value} className="flex items-center gap-1.5 text-xs text-sand-700">
                      <Checkbox checked={setores.includes(s.value)} onCheckedChange={() => toggleSetor(s.value)} />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="relative w-full max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
                  <Input placeholder="Buscar cliente..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <span className="whitespace-nowrap text-xs text-sand-500">{selectedIds.size} selecionado{selectedIds.size === 1 ? "" : "s"}</span>
              </div>
              <div className="max-h-72 overflow-y-auto rounded-lg border border-sand-200">
                <label className="flex items-center gap-2 border-b border-sand-200 bg-sand-50 px-3 py-2 text-xs font-medium text-sand-600">
                  <Checkbox checked={todosFiltradosSelecionados} onCheckedChange={toggleTodosFiltrados} />
                  Selecionar todos ({filtrados.length})
                </label>
                {filtrados.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 border-b border-sand-100 px-3 py-2 text-xs last:border-b-0 hover:bg-sand-50">
                    <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleCliente(c.id)} />
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium text-sand-800">{c.dados.nomeFantasia ?? c.dados.razaoSocial}</span>
                      <span className="ml-2 text-sand-400">{c.dados.cnpj}</span>
                    </span>
                    {c.dados.clienteParceiro && (
                      <span className="whitespace-nowrap text-[10px] text-sand-400">já é parceiro: {c.dados.nomeParceiro}</span>
                    )}
                  </label>
                ))}
                {filtrados.length === 0 && (
                  <p className="px-3 py-6 text-center text-xs text-sand-400">Nenhum cliente encontrado.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {aplicado !== null ? "Fechar" : "Cancelar"}
          </Button>
          {aplicado === null && (
            <Button type="button" onClick={handleAplicar} disabled={selectedIds.size === 0 || !nomeParceiro.trim() || setores.length === 0}>
              Marcar {selectedIds.size || ""} cliente{selectedIds.size === 1 ? "" : "s"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
