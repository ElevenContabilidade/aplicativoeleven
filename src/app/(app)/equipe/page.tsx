"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmpresasVinculadas } from "@/components/equipe/empresas-vinculadas";
import { ColaboradorFormDialog } from "@/components/equipe/colaborador-form-dialog";
import { useAppStore } from "@/lib/store/app-store";
import type { TeamMember } from "@/lib/types";
import { initials } from "@/lib/utils";

const MODULOS_OPERACAO = ["Comercial", "Clientes", "Tarefas", "Obrigações", "Fiscal", "Contábil", "Financeiro", "Documentos"];
const MODULOS_GESTAO = ["Boletos", "NFSe", "Parceiros", "Portfólio", "Atendimento", "Relatórios", "Equipe", "Eleven IA", "Configurações"];
const ACOES = ["Visualizar", "Criar", "Editar", "Excluir", "Exportar"];

export default function EquipePage() {
  const team = useAppStore((s) => s.team);
  const deleteTeamMember = useAppStore((s) => s.deleteTeamMember);
  const updateTeamMember = useAppStore((s) => s.updateTeamMember);
  const [selectedId, setSelectedId] = useState(team[0]?.id);
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>(Object.fromEntries(team.map((m) => [m.id, m.ativo])));
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);

  const selected = team.find((m) => m.id === selectedId);

  function togglePerm(key: string) {
    setPerms((p) => ({ ...p, [key]: !defaultPerm(key, p) }));
  }
  function defaultPerm(key: string, p: Record<string, boolean>) {
    if (key in p) return p[key];
    return true;
  }

  function openNovo() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(m: TeamMember) {
    setEditing(m);
    setFormOpen(true);
  }
  function handleDelete(m: TeamMember) {
    if (!confirm(`Excluir o colaborador "${m.nome}"? Essa ação não pode ser desfeita.`)) return;
    deleteTeamMember(m.id);
    if (selectedId === m.id) {
      const remaining = team.filter((t) => t.id !== m.id);
      setSelectedId(remaining[0]?.id);
    }
  }

  return (
    <div>
      <PageHeader
        title="Equipe"
        description="Colaboradores da Eleven, perfis de acesso e permissões por módulo."
        actions={<Button onClick={openNovo}><Plus className="size-3.5" /> Novo colaborador</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Colaboradores</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 pt-4">
            {team.map((m) => (
              <div
                key={m.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(m.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedId(m.id)}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  selectedId === m.id ? "bg-wine-50" : "hover:bg-sand-50"
                }`}
              >
                <Avatar>
                  <AvatarFallback style={{ backgroundColor: `${m.avatarColor}1a`, color: m.avatarColor }}>{initials(m.nome)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-sand-900">{m.nome}</span>
                  <span className="block truncate text-[11px] text-sand-500">{m.perfil}</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openEdit(m); }}
                  title="Editar colaborador"
                  className="rounded-md p-1.5 text-sand-400 transition-colors hover:bg-sand-100 hover:text-sand-700"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(m); }}
                  title="Excluir colaborador"
                  className="rounded-md p-1.5 text-sand-400 transition-colors hover:bg-status-danger/10 hover:text-status-danger"
                >
                  <Trash2 className="size-3.5" />
                </button>
                <Switch
                  checked={activeMap[m.id] ?? m.ativo}
                  onCheckedChange={(v) => setActiveMap((s) => ({ ...s, [m.id]: v }))}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Permissões {selected ? `— ${selected.nome}` : ""}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {selected && (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-sand-500">{selected.email}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selected.departamentos.map((d) => (
                        <Badge key={d} variant="outline">{d}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <Select value={selected.perfil} onValueChange={(v) => updateTeamMember(selected.id, { perfil: v as typeof selected.perfil })}>
                      <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Administrador", "Gestor", "Comercial", "Fiscal", "Contábil", "Departamento Pessoal", "Societário", "Financeiro", "Atendimento"].map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-wide text-sand-400">
                        <th className="py-2 pr-2">Módulo</th>
                        {ACOES.map((a) => (
                          <th key={a} className="px-2 py-2 text-center">{a}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MODULOS_OPERACAO.map((mod) => (
                        <tr key={mod} className="border-t border-sand-100">
                          <td className="py-2 pr-2 font-medium text-sand-800">{mod}</td>
                          {ACOES.map((a) => {
                            const key = `${selected.id}-${mod}-${a}`;
                            return (
                              <td key={a} className="px-2 py-2 text-center">
                                <Checkbox checked={defaultPerm(key, perms)} onCheckedChange={() => togglePerm(key)} />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr className="border-t border-sand-200">
                        <td colSpan={ACOES.length + 1} className="py-2 pr-2 text-[10px] font-semibold uppercase tracking-wide text-wine-700">
                          Módulos de Gestão
                        </td>
                      </tr>
                      {MODULOS_GESTAO.map((mod) => (
                        <tr key={mod} className="border-t border-sand-100">
                          <td className="py-2 pr-2 font-medium text-sand-800">{mod}</td>
                          {ACOES.map((a) => {
                            const key = `${selected.id}-${mod}-${a}`;
                            return (
                              <td key={a} className="px-2 py-2 text-center">
                                <Checkbox checked={defaultPerm(key, perms)} onCheckedChange={() => togglePerm(key)} />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {selected && <EmpresasVinculadas key={selected.id} memberId={selected.id} />}

      <ColaboradorFormDialog key={editing?.id ?? "new"} open={formOpen} onOpenChange={setFormOpen} colaborador={editing} />
    </div>
  );
}
