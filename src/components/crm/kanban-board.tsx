"use client";

import { useState } from "react";
import { DndContext, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { LEAD_STAGES, type Lead, type LeadStage } from "@/lib/types";
import { LeadCard } from "./lead-card";
import { LeadDetailDialog } from "./lead-detail-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { teamName } from "@/lib/data/seed";
import { formatCurrency } from "@/lib/utils";

function Column({ stage, leads, onOpen }: { stage: LeadStage; leads: Lead[]; onOpen: (l: Lead) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = leads.reduce((a, l) => a + l.valorEstimado, 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-2xl border border-sand-200 bg-sand-100/60 p-2.5 transition-colors ${
        isOver ? "border-wine-400 bg-wine-50" : ""
      }`}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-sand-700">{stage}</p>
        <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-sand-500">{leads.length}</span>
      </div>
      <p className="mb-2 px-1 text-[10px] text-sand-400">{formatCurrency(total)}</p>
      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin" style={{ maxHeight: "calc(100vh - 320px)" }}>
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onOpen={() => onOpen(lead)} />
        ))}
        {leads.length === 0 && <p className="px-2 py-6 text-center text-[11px] text-sand-400">Sem leads nesta etapa</p>}
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const leads = useAppStore((s) => s.leads);
  const moveLead = useAppStore((s) => s.moveLead);
  const { userId } = useAuthStore();
  const [selected, setSelected] = useState<Lead | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(e: DragEndEvent) {
    const stage = e.over?.id as LeadStage | undefined;
    const leadId = e.active.id as string;
    if (!stage) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === stage) return;
    moveLead(leadId, stage, teamName(userId ?? ""));
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
          {LEAD_STAGES.map((stage) => (
            <Column key={stage} stage={stage} leads={leads.filter((l) => l.stage === stage)} onOpen={setSelected} />
          ))}
        </div>
      </DndContext>

      <LeadDetailDialog lead={selected} onClose={() => setSelected(null)} />
    </>
  );
}
