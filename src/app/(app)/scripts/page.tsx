"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Settings2, X, MessagesSquare, Boxes, FileCheck2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ScriptFormDialog } from "@/components/scripts/script-form-dialog";
import { GerenciarDepartamentosDialog } from "@/components/scripts/gerenciar-departamentos-dialog";
import { useAppStore } from "@/lib/store/app-store";
import type { Script } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ScriptsPage() {
  const departamentos = useAppStore((s) => s.scriptsDepartamentos);
  const scripts = useAppStore((s) => s.scripts);
  const deleteScript = useAppStore((s) => s.deleteScript);

  const [query, setQuery] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState<string | "todos">("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [departamentosOpen, setDepartamentosOpen] = useState(false);

  const comMensagem = scripts.filter((s) => s.mensagem && s.mensagem.trim().length > 0).length;
  const pctComMensagem = scripts.length > 0 ? Math.round((comMensagem / scripts.length) * 100) : 0;

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scripts.filter((s) => {
      const matchesDepto = filtroDepartamento === "todos" || s.departamentoId === filtroDepartamento;
      const matchesQuery =
        q === "" || s.titulo.toLowerCase().includes(q) || (s.mensagem ?? "").toLowerCase().includes(q);
      return matchesDepto && matchesQuery;
    });
  }, [scripts, query, filtroDepartamento]);

  function nomeDepartamento(id: string) {
    return departamentos.find((d) => d.id === id)?.nome ?? "—";
  }

  function openNovo() {
    setEditingScript(null);
    setFormOpen(true);
  }
  function openEdit(script: Script) {
    setEditingScript(script);
    setFormOpen(true);
  }
  function handleDelete(script: Script) {
    if (!confirm(`Excluir o script "${script.titulo}"?`)) return;
    deleteScript(script.id);
  }

  return (
    <div>
      <PageHeader
        title="Scripts"
        description="Mensagens prontas por departamento, pra agilizar o atendimento."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDepartamentosOpen(true)}>
              <Settings2 className="size-3.5" /> Gerenciar departamentos
            </Button>
            <Button onClick={openNovo}><Plus className="size-3.5" /> Novo script</Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Total de scripts" value={scripts.length} icon={MessagesSquare} tone="wine" />
        <MetricCard label="Departamentos" value={departamentos.length} icon={Boxes} tone="neutral" />
        <MetricCard label="Com mensagem preenchida" value={comMensagem} icon={FileCheck2} hint={`${pctComMensagem}% do total`} tone="success" />
      </div>

      <div className="relative mb-3 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
        <Input
          placeholder="Buscar por palavra ou frase, em todos os departamentos..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <FiltroChip label="Todos" active={filtroDepartamento === "todos"} onClick={() => setFiltroDepartamento("todos")} />
        {departamentos.map((d) => (
          <FiltroChip key={d.id} label={d.nome} active={filtroDepartamento === d.id} onClick={() => setFiltroDepartamento(d.id)} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtrados.map((s) => (
          <Card key={s.id} className="relative">
            <button
              type="button"
              onClick={() => handleDelete(s)}
              className="absolute right-2 top-2 rounded-md p-1 text-sand-300 hover:bg-status-danger-bg hover:text-status-danger"
              title="Excluir"
            >
              <X className="size-3.5" />
            </button>
            <CardContent className="cursor-pointer p-4" onClick={() => openEdit(s)}>
              <span className="mb-2 inline-block rounded-full bg-wine-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-wine-700">
                {nomeDepartamento(s.departamentoId)}
              </span>
              <p className="pr-4 text-sm font-medium text-sand-900">{s.titulo}</p>
              <p className="mt-1 line-clamp-2 text-[11px] text-sand-400">{s.mensagem || "Sem mensagem ainda"}</p>
            </CardContent>
          </Card>
        ))}
        {filtrados.length === 0 && (
          <p className="col-span-full py-10 text-center text-xs text-sand-400">Nenhum script encontrado.</p>
        )}
      </div>

      <ScriptFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        script={editingScript}
        departamentoIdPadrao={filtroDepartamento !== "todos" ? filtroDepartamento : undefined}
      />
      <GerenciarDepartamentosDialog open={departamentosOpen} onOpenChange={setDepartamentosOpen} />
    </div>
  );
}

function FiltroChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
        active ? "border-wine-600 bg-wine-700 text-cream-50" : "border-sand-300 bg-white text-sand-600 hover:bg-sand-100"
      )}
    >
      {label}
    </button>
  );
}
