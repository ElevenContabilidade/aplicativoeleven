"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { TEAM, CLIENTS } from "@/lib/data/seed";
import type { Departamento, Task, TaskPrioridade } from "@/lib/types";

const DEPARTAMENTOS: Departamento[] = ["Comercial", "Relacionamento", "Fiscal", "Contábil", "Pessoal", "Societário", "Financeiro", "Atendimento"];
const PRIORIDADES: TaskPrioridade[] = ["Baixa", "Normal", "Alta", "Urgente"];

export function TaskFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addTask = useAppStore((s) => s.addTask);
  const { userId } = useAuthStore();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [clienteId, setClienteId] = useState<string>("none");
  const [departamento, setDepartamento] = useState<Departamento>("Fiscal");
  const [responsavelId, setResponsavelId] = useState(userId ?? TEAM[0].id);
  const [prioridade, setPrioridade] = useState<TaskPrioridade>("Normal");
  const [prazo, setPrazo] = useState(new Date().toISOString().slice(0, 10));

  function reset() {
    setTitulo(""); setDescricao(""); setClienteId("none"); setDepartamento("Fiscal");
    setResponsavelId(userId ?? TEAM[0].id); setPrioridade("Normal"); setPrazo(new Date().toISOString().slice(0, 10));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo) return;
    const task: Task = {
      id: `t-${Date.now()}`,
      titulo,
      descricao: descricao || undefined,
      clienteId: clienteId === "none" ? undefined : clienteId,
      departamento,
      responsavelId,
      prioridade,
      prazo,
      status: "Não iniciada",
      subtarefas: [],
      comentarios: [],
    };
    addTask(task);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Título *</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          </div>
          <div>
            <Label className="mb-1 block">Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (interno)</SelectItem>
                  {CLIENTS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.dados.nomeFantasia ?? c.dados.razaoSocial}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Departamento</Label>
              <Select value={departamento} onValueChange={(v) => setDepartamento(v as Departamento)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTAMENTOS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Responsável</Label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEAM.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Prioridade</Label>
              <Select value={prioridade} onValueChange={(v) => setPrioridade(v as TaskPrioridade)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORIDADES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Prazo</Label>
              <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Criar tarefa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
