"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Repeat } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/data/seed";
import type { Task } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export default function TarefasPage() {
  const tasks = useAppStore((s) => s.tasks);
  const clients = useAppStore((s) => s.clients);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(() => searchParams.get("novo") === "1");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = tasks.find((t) => t.id === selectedId) ?? null;
  const [status, setStatus] = useState("Abertas");
  const [departamento, setDepartamento] = useState("Todos");

  useEffect(() => {
    if (searchParams.get("novo") === "1") router.replace("/tarefas");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departamentos = ["Todos", ...Array.from(new Set(tasks.map((t) => t.departamento)))];

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => (status === "Abertas" ? !["Concluída", "Cancelada"].includes(t.status) : status === "Todas" ? true : t.status === status))
      .filter((t) => departamento === "Todos" || t.departamento === departamento)
      .sort((a, b) => a.prazo.localeCompare(b.prazo));
  }, [tasks, status, departamento]);

  function isOverdue(t: Task) {
    return !["Concluída", "Cancelada"].includes(t.status) && new Date(t.prazo) < new Date(new Date().toDateString());
  }

  return (
    <div>
      <PageHeader
        title="Tarefas"
        description="Gestão de tarefas operacionais por departamento, cliente e responsável."
        actions={<Button onClick={() => setFormOpen(true)}><Plus className="size-3.5" /> Nova tarefa</Button>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Abertas">Abertas</SelectItem>
            <SelectItem value="Todas">Todas</SelectItem>
            <SelectItem value="Concluída">Concluídas</SelectItem>
            <SelectItem value="Cancelada">Canceladas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={departamento} onValueChange={setDepartamento}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            {departamentos.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarefa</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((t) => {
            const client = clients.find((c) => c.id === t.clienteId);
            return (
              <TableRow key={t.id} className="cursor-pointer" onClick={() => setSelectedId(t.id)}>
                <TableCell>
                  <span className="flex items-center gap-1.5 font-medium text-sand-900">
                    {t.titulo}
                    {t.recorrencia && t.recorrencia !== "Nenhuma" && <Repeat className="size-3 text-sand-400" />}
                  </span>
                </TableCell>
                <TableCell>{client ? client.dados.nomeFantasia ?? client.dados.razaoSocial : "—"}</TableCell>
                <TableCell>{t.departamento}</TableCell>
                <TableCell>{teamName(t.responsavelId)}</TableCell>
                <TableCell><StatusBadge status={t.prioridade} /></TableCell>
                <TableCell className={cn(isOverdue(t) && "font-semibold text-status-danger")}>{formatDate(t.prazo)}</TableCell>
                <TableCell>
                  {isOverdue(t) ? <Badge variant="danger">Em atraso</Badge> : <StatusBadge status={t.status} />}
                </TableCell>
              </TableRow>
            );
          })}
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={7} className="py-10 text-center text-sand-400">Nenhuma tarefa encontrada.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <TaskDetailDialog task={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}
