"use client";

import { DndContext, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { Task, TaskStatus } from "@/lib/types";
import { TaskCard } from "./task-card";
import { useAppStore } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";

const COLUMNS = [
  { id: "afazer", label: "A fazer", statuses: ["Não iniciada"] as TaskStatus[], dropStatus: "Não iniciada" as TaskStatus },
  {
    id: "andamento",
    label: "Em andamento",
    statuses: ["Em andamento", "Aguardando cliente", "Aguardando órgão", "Em análise"] as TaskStatus[],
    dropStatus: "Em andamento" as TaskStatus,
  },
  { id: "concluido", label: "Concluído", statuses: ["Concluída"] as TaskStatus[], dropStatus: "Concluída" as TaskStatus },
];

function Column({
  columnId,
  label,
  tasks,
  onOpen,
}: {
  columnId: string;
  label: string;
  tasks: Task[];
  onOpen: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-80 shrink-0 flex-col rounded-2xl border border-sand-200 bg-sand-100/60 p-2.5 transition-colors",
        isOver && "border-wine-400 bg-wine-50"
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-sand-700">{label}</p>
        <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-sand-500">{tasks.length}</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin" style={{ maxHeight: "calc(100vh - 320px)" }}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={() => onOpen(task)} />
        ))}
        {tasks.length === 0 && <p className="px-2 py-6 text-center text-[11px] text-sand-400">Nenhuma tarefa aqui</p>}
      </div>
    </div>
  );
}

export function TaskKanbanBoard({ tasks, onOpen }: { tasks: Task[]; onOpen: (task: Task) => void }) {
  const updateTask = useAppStore((s) => s.updateTask);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(e: DragEndEvent) {
    const columnId = e.over?.id as string | undefined;
    const taskId = e.active.id as string;
    const column = COLUMNS.find((c) => c.id === columnId);
    if (!column) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || column.statuses.includes(task.status)) return;
    updateTask(taskId, { status: column.dropStatus });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            columnId={col.id}
            label={col.label}
            tasks={tasks.filter((t) => col.statuses.includes(t.status))}
            onOpen={onOpen}
          />
        ))}
      </div>
    </DndContext>
  );
}
