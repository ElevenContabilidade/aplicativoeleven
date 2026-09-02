"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { teamName } from "@/lib/team-lookup";
import type { Task, TaskStatus } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";

const STATUSES: TaskStatus[] = ["Não iniciada", "Em andamento", "Aguardando cliente", "Aguardando órgão", "Em análise", "Concluída", "Cancelada"];

export function TaskDetailDialog({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const updateTask = useAppStore((s) => s.updateTask);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const clients = useAppStore((s) => s.clients);
  const { userId } = useAuthStore();
  const [comment, setComment] = useState("");
  const [subtaskTitle, setSubtaskTitle] = useState("");

  if (!task) return null;
  const client = clients.find((c) => c.id === task.clienteId);

  function addComment() {
    if (!comment.trim() || !task) return;
    updateTask(task.id, {
      comentarios: [...task.comentarios, { id: `cm-${Date.now()}`, autor: teamName(userId ?? ""), data: new Date().toISOString().slice(0, 10), texto: comment }],
    });
    setComment("");
  }

  function addSubtask() {
    if (!subtaskTitle.trim() || !task) return;
    updateTask(task.id, { subtarefas: [...task.subtarefas, { id: `st-${Date.now()}`, titulo: subtaskTitle, concluida: false }] });
    setSubtaskTitle("");
  }

  function toggleSubtask(id: string) {
    if (!task) return;
    updateTask(task.id, { subtarefas: task.subtarefas.map((s) => (s.id === id ? { ...s, concluida: !s.concluida } : s)) });
  }

  function handleDelete() {
    if (!task) return;
    if (confirm(`Excluir a tarefa "${task.titulo}"? Essa ação não pode ser desfeita.`)) {
      deleteTask(task.id);
      onClose();
    }
  }

  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task.titulo}</DialogTitle>
          {task.descricao && <p className="text-xs text-sand-500">{task.descricao}</p>}
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={task.prioridade} />
          <Badge variant="outline">{task.departamento}</Badge>
          {client && <Badge variant="cream">{client.dados.nomeFantasia ?? client.dados.razaoSocial}</Badge>}
          <span className="text-xs text-sand-400">Prazo {formatDate(task.prazo)} • {teamName(task.responsavelId)}</span>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-sand-600">Status</label>
            <Select value={task.status} onValueChange={(v) => updateTask(task.id, { status: v as TaskStatus })}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleDelete} className="text-status-danger hover:bg-status-danger-bg">
            <Trash2 className="size-3.5" /> Excluir tarefa
          </Button>
        </div>

        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold text-sand-700">Subtarefas</p>
          <div className="space-y-1">
            {task.subtarefas.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-xs">
                <Checkbox checked={s.concluida} onCheckedChange={() => toggleSubtask(s.id)} />
                <span className={s.concluida ? "text-sand-400 line-through" : "text-sand-800"}>{s.titulo}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input value={subtaskTitle} onChange={(e) => setSubtaskTitle(e.target.value)} placeholder="Nova subtarefa" className="h-8 text-xs" />
            <Button type="button" size="sm" variant="outline" onClick={addSubtask}>Adicionar</Button>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold text-sand-700">Comentários</p>
          <div className="max-h-32 space-y-2 overflow-y-auto scrollbar-thin">
            {task.comentarios.map((c) => (
              <div key={c.id} className="text-[11px] text-sand-600">
                <span className="font-medium text-sand-800">{c.autor}</span> — {formatDateTime(c.data)}
                <p className="text-sand-500">{c.texto}</p>
              </div>
            ))}
            {task.comentarios.length === 0 && <p className="text-[11px] text-sand-400">Sem comentários.</p>}
          </div>
          <div className="mt-2 flex gap-2">
            <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Escrever um comentário" className="h-8 text-xs" />
            <Button type="button" size="sm" variant="outline" onClick={addComment}>Enviar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
