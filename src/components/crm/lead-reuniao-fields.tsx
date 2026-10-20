"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { LembreteReuniao, ReuniaoLead } from "@/lib/types";

const LEMBRETES: LembreteReuniao[] = ["Nenhum", "No dia", "1 dia antes", "1 hora antes"];

/** Campos da reunião marcada com o lead: data, data de término opcional,
 * horário opcional e lembrete. O lembrete só fica guardado — ainda não
 * dispara nenhum aviso automático. */
export function LeadReuniaoFields({ reuniao, onChange }: { reuniao: ReuniaoLead | undefined; onChange: (reuniao: ReuniaoLead | undefined) => void }) {
  const r = reuniao ?? { data: "" };

  function set(patch: Partial<ReuniaoLead>) {
    const atualizado = { ...r, ...patch };
    onChange(atualizado.data ? atualizado : undefined);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <Label className="mb-1 block">Data da reunião</Label>
        <Input type="date" value={r.data} onChange={(e) => set({ data: e.target.value })} />
      </div>
      {r.data && (
        <>
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs text-sand-700">
              <Checkbox checked={!!r.dataTermino} onCheckedChange={(v) => set({ dataTermino: v === true ? r.data : undefined })} />
              Data de término
            </label>
            {r.dataTermino !== undefined && (
              <Input type="date" value={r.dataTermino} onChange={(e) => set({ dataTermino: e.target.value })} className="h-8 text-xs" />
            )}
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs text-sand-700">
              <Checkbox checked={!!r.horario} onCheckedChange={(v) => set({ horario: v === true ? "09:00" : undefined })} />
              Incluir horário
            </label>
            {r.horario !== undefined && (
              <Input type="time" value={r.horario} onChange={(e) => set({ horario: e.target.value })} className="h-8 text-xs" />
            )}
          </div>
          <div className="col-span-2">
            <Label className="mb-1 block">Lembrete</Label>
            <Select value={r.lembrete ?? "Nenhum"} onValueChange={(v) => set({ lembrete: v as LembreteReuniao })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEMBRETES.map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
}
