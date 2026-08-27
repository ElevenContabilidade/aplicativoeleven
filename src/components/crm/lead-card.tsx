"use client";

import { useDraggable } from "@dnd-kit/core";
import { Building2, MapPin, Phone, User, Tag, Calendar } from "lucide-react";
import type { Lead } from "@/lib/types";
import { teamName } from "@/lib/data/seed";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });

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
      className={`cursor-grab rounded-xl border border-sand-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <p className="truncate text-sm font-semibold text-sand-900">{lead.nome}</p>
      {lead.empresa && (
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-sand-500">
          <Building2 className="size-3 shrink-0" /> {lead.empresa}
        </p>
      )}
      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-sand-500">
        <MapPin className="size-3 shrink-0" /> {lead.cidade}/{lead.estado}
      </p>
      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-sand-500">
        <Phone className="size-3 shrink-0" /> {lead.telefone}
      </p>

      <div className="mt-2 flex flex-wrap gap-1">
        <Badge variant="outline" className="gap-1">
          <Tag className="size-2.5" /> {lead.origem}
        </Badge>
        {lead.servicosInteresse.slice(0, 1).map((s) => (
          <Badge key={s} variant="cream">
            {s}
          </Badge>
        ))}
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-sand-100 pt-2 text-[11px] text-sand-500">
        <span className="flex items-center gap-1">
          <User className="size-3" /> {teamName(lead.responsavelId).split(" ")[0]}
        </span>
        <span className="font-semibold text-wine-700">{formatCurrency(lead.valorEstimado)}</span>
      </div>
      <p className="mt-1 flex items-center gap-1 text-[11px] text-sand-400">
        <Calendar className="size-3" /> últ. contato {formatDate(lead.dataUltimoContato)}
      </p>
    </div>
  );
}
