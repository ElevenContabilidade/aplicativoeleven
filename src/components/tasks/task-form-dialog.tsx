"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import type { Departamento, Task, TaskPrioridade } from "@/lib/types";

const DEPARTAMENTOS: Departamento[] = ["Comercial", "Relacionamento", "Fiscal", "Contábil", "Pessoal", "Societário", "Financeiro", "Atendimento"];
const PRIORIDADES: TaskPrioridade[] = ["Baixa", "Normal", "Alta", "Urgente"];
const TODOS_VENCIMENTOS = "todos";
const SEM_VENCIMENTO = "nenhum";

export function TaskFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addTask = useAppStore((s) => s.addTask);
  const team = useAppStore((s) => s.team);
  const clients = useAppStore((s) => s.clients);
  const { userId } = useAuthStore();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [clienteIds, setClienteIds] = useState<string[]>([]);
  const [filtroVencimento, setFiltroVencimento] = useState(TODOS_VENCIMENTOS);
  const [departamento, setDepartamento] = useState<Departamento>("Fiscal");
  const [responsavelId, setResponsavelId] = useState(userId ?? team[0]?.id ?? "");
  const [prioridade, setPrioridade] = useState<TaskPrioridade>("Normal");
  const [prazo, setPrazo] = useState(new Date().toISOString().slice(0, 10));

  // Dias de vencimento de honorário que de fato existem na carteira —
  // pra oferecer só os que fazem sentido escolher no filtro (ex: "Enviar
  // boletos dia 05" já aparece com todo mundo que vence dia 5 marcável
  // de uma vez, em vez de caçar cliente por cliente).
  const diasVencimento = useMemo(
    () => [...new Set(clients.map((c) => c.financeiro.vencimentoDia).filter((d): d is number => !!d))].sort((a, b) => a - b),
    [clients]
  );

  const clientesFiltrados = useMemo(() => {
    const ordenados = [...clients].sort((a, b) =>
      (a.dados.nomeFantasia ?? a.dados.razaoSocial).localeCompare(b.dados.nomeFantasia ?? b.dados.razaoSocial, "pt-BR")
    );
    if (filtroVencimento === TODOS_VENCIMENTOS) return ordenados;
    if (filtroVencimento === SEM_VENCIMENTO) return ordenados.filter((c) => !c.financeiro.vencimentoDia);
    return ordenados.filter((c) => c.financeiro.vencimentoDia === Number(filtroVencimento));
  }, [clients, filtroVencimento]);

  const todosFiltradosSelecionados = clientesFiltrados.length > 0 && clientesFiltrados.every((c) => clienteIds.includes(c.id));

  function toggleCliente(id: string) {
    setClienteIds((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
  }

  function toggleTodosFiltrados() {
    setClienteIds((atual) => {
      const idsFiltrados = clientesFiltrados.map((c) => c.id);
      if (todosFiltradosSelecionados) return atual.filter((id) => !idsFiltrados.includes(id));
      return [...new Set([...atual, ...idsFiltrados])];
    });
  }

  function reset() {
    setTitulo(""); setDescricao(""); setClienteIds([]); setFiltroVencimento(TODOS_VENCIMENTOS); setDepartamento("Fiscal");
    setResponsavelId(userId ?? team[0]?.id ?? ""); setPrioridade("Normal"); setPrazo(new Date().toISOString().slice(0, 10));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo) return;
    const task: Task = {
      id: `t-${Date.now()}`,
      titulo,
      descricao: descricao || undefined,
      clienteId: clienteIds[0],
      clienteIds: clienteIds.length > 1 ? clienteIds : undefined,
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
          <div>
            <Label className="mb-1 block">Cliente(s)</Label>
            <p className="mb-1.5 text-[11px] text-sand-400">Deixe em branco pra tarefa interna, marque um ou vários — ex: todo mundo que vence dia 05.</p>
            <div className="mb-2 flex items-center gap-2">
              <span className="shrink-0 text-[11px] text-sand-500">Filtrar por vencimento do honorário:</span>
              <Select value={filtroVencimento} onValueChange={setFiltroVencimento}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS_VENCIMENTOS}>Todos</SelectItem>
                  {diasVencimento.map((d) => (
                    <SelectItem key={d} value={String(d)}>Dia {String(d).padStart(2, "0")}</SelectItem>
                  ))}
                  <SelectItem value={SEM_VENCIMENTO}>Sem vencimento definido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-sand-200">
              <label className="flex items-center gap-2 border-b border-sand-100 bg-sand-50 px-3 py-1.5 text-xs font-medium hover:bg-sand-100">
                <Checkbox checked={todosFiltradosSelecionados} onCheckedChange={toggleTodosFiltrados} />
                <span>Selecionar todos (filtrados)</span>
              </label>
              {clientesFiltrados.map((c) => (
                <label key={c.id} className="flex items-center gap-2 border-b border-sand-100 px-3 py-1.5 text-xs last:border-b-0 hover:bg-sand-50">
                  <Checkbox checked={clienteIds.includes(c.id)} onCheckedChange={() => toggleCliente(c.id)} />
                  <span className="truncate">{c.dados.nomeFantasia ?? c.dados.razaoSocial}</span>
                </label>
              ))}
              {clientesFiltrados.length === 0 && (
                <p className="px-3 py-4 text-center text-[11px] text-sand-400">Nenhum cliente com esse vencimento.</p>
              )}
            </div>
            <p className="mt-1 text-[11px] text-sand-400">
              {clienteIds.length === 0 ? "Tarefa interna, sem cliente." : `${clienteIds.length} cliente${clienteIds.length === 1 ? "" : "s"} selecionado${clienteIds.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
                  {team.map((m) => (
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
