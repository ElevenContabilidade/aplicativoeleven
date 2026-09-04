"use client";

import { useState } from "react";
import { Plus, Trash2, Check, AlertTriangle, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import type { Pendencia, PendenciaTipo } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const TIPOS: PendenciaTipo[] = ["Documento", "Assinatura", "Informação", "Outro"];

function estaAtrasada(p: Pendencia): boolean {
  if (p.status === "Concluída" || !p.prazo) return false;
  return new Date(p.prazo) < new Date(new Date().toISOString().slice(0, 10));
}

export function PendenciasTab({ clienteId }: { clienteId: string }) {
  const todasPendencias = useAppStore((s) => s.pendencias);
  const pendencias = todasPendencias.filter((p) => p.clienteId === clienteId);
  const addPendencia = useAppStore((s) => s.addPendencia);
  const updatePendencia = useAppStore((s) => s.updatePendencia);
  const deletePendencia = useAppStore((s) => s.deletePendencia);

  const [formOpen, setFormOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<PendenciaTipo>("Documento");
  const [prazo, setPrazo] = useState("");

  function abrir() {
    setTitulo("");
    setTipo("Documento");
    setPrazo("");
    setFormOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    addPendencia({
      id: `pend-${Date.now()}`,
      clienteId,
      titulo: titulo.trim(),
      tipo,
      prazo: prazo || undefined,
      status: "Pendente",
      criadoEm: new Date().toISOString(),
    });
    setFormOpen(false);
  }

  const abertas = pendencias.filter((p) => p.status !== "Concluída");
  const concluidas = pendencias.filter((p) => p.status === "Concluída");

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-sand-500">
            O que o escritório está aguardando desse cliente — ele vê essa lista no Portal do Cliente.
          </p>
          <Button size="sm" onClick={abrir}>
            <Plus className="size-3.5" /> Nova pendência
          </Button>
        </div>

        <div className="space-y-2">
          {abertas.map((p) => {
            const atrasada = estaAtrasada(p);
            return (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-sand-200 px-3 py-2.5 text-xs">
                <div className="min-w-0">
                  <span className="block truncate font-medium text-sand-800">{p.titulo}</span>
                  <span className="text-sand-400">
                    {p.tipo}{p.prazo ? ` • prazo ${formatDate(p.prazo)}` : ""}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {atrasada && (
                    <Badge variant="danger"><AlertTriangle className="size-3" /> Atrasado</Badge>
                  )}
                  <Button size="sm" variant="outline" onClick={() => updatePendencia(p.id, { status: "Concluída" })}>
                    <Check className="size-3.5" /> Concluir
                  </Button>
                  <button
                    type="button"
                    onClick={() => confirm(`Excluir a pendência "${p.titulo}"?`) && deletePendencia(p.id)}
                    className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          {abertas.length === 0 && <p className="text-xs text-sand-400">Nenhuma pendência em aberto.</p>}
        </div>

        {concluidas.length > 0 && (
          <div className="space-y-1.5 border-t border-sand-100 pt-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-sand-400">Concluídas</p>
            {concluidas.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-sand-100 bg-sand-50 px-3 py-2 text-xs">
                <span className="truncate text-sand-500 line-through">{p.titulo}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updatePendencia(p.id, { status: "Pendente" })}
                    title="Reabrir"
                    className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-wine-700"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => confirm(`Excluir a pendência "${p.titulo}"?`) && deletePendencia(p.id)}
                    className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova pendência</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label className="mb-1 block">Título *</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Enviar RG do sócio administrador"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as PendenciaTipo)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block">Prazo (opcional)</Label>
                <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button type="submit">Criar pendência</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
