"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskKanbanBoard } from "@/components/tasks/task-kanban-board";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { useAppStore } from "@/lib/store/app-store";

export default function TarefasPage() {
  const tasks = useAppStore((s) => s.tasks);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [formOpen, setFormOpen] = useState(() => searchParams.get("novo") === "1");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = tasks.find((t) => t.id === selectedId) ?? null;
  const [departamento, setDepartamento] = useState("Todos");

  useEffect(() => {
    if (searchParams.get("novo") === "1") router.replace("/tarefas");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departamentos = ["Todos", ...Array.from(new Set(tasks.map((t) => t.departamento)))];

  const filtered = useMemo(
    () => tasks.filter((t) => departamento === "Todos" || t.departamento === departamento),
    [tasks, departamento]
  );

  return (
    <div>
      <PageHeader
        title="Tarefas"
        description="Gestão de tarefas operacionais por departamento, cliente e responsável. Arraste os cards entre as colunas."
        actions={<Button onClick={() => setFormOpen(true)}><Plus className="size-3.5" /> Nova tarefa</Button>}
      />

      <div className="mb-4">
        <Select value={departamento} onValueChange={setDepartamento}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {departamentos.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TaskKanbanBoard tasks={filtered} onOpen={(t) => setSelectedId(t.id)} />

      <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <TaskDetailDialog task={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}
