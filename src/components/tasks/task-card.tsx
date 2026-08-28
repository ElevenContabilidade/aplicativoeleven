"use client";

import { useDraggable } from "@dnd-kit/core";
import { Repeat, Calendar } from "lucide-react";
import type { Task } from "@/lib/types";
import { teamName } from "@/lib/data/seed";
import { useAppStore } from "@/lib/store/app-store";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn, formatDate } from "@/lib/utils";

export function TaskCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const clients = useAppStore((s) => s.clients);
  const client = clients.find((c) => c.id === task.clienteId);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  const overdue = !["Concluída", "Cancelada"].includes(task.status) && new Date(task.prazo) < new Date(new Date().toDateString());

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      className={cn(
        "cursor-grab rounded-xl border border-sand-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <p className="flex items-start gap-1.5 text-sm font-semibold text-sand-900">
        <span className="flex-1">{task.titulo}</span>
        {task.recorrencia && task.recorrencia !== "Nenhuma" && <Repeat className="mt-0.5 size-3 shrink-0 text-sand-400" />}
      </p>
      {client && <p className="mt-0.5 truncate text-xs text-sand-500">{client.dados.nomeFantasia ?? client.dados.razaoSocial}</p>}

      <div className="mt-2 flex flex-wrap gap-1">
        <StatusBadge status={task.departamento} />
        <StatusBadge status={task.prioridade} />
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-sand-100 pt-2 text-[11px] text-sand-500">
        <span className="truncate">{teamName(task.responsavelId).split(" ")[0]}</span>
        <span className={cn("flex items-center gap-1", overdue && "font-semibold text-status-danger")}>
          <Calendar className="size-3" /> {formatDate(task.prazo)}
        </span>
      </div>
    </div>
  );
}
