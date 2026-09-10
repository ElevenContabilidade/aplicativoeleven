"use client";

import { useMemo, useState } from "react";
import { Layers, Wallet, CheckCircle2, Eye, EyeOff, Copy, Check, Pencil, Trash2, Plus, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SistemaFormDialog } from "@/components/office/sistema-form-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { SETORES_SISTEMA, type SistemaEscritorio } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

function isAtivo(sis: SistemaEscritorio) {
  return (sis.situacao ?? "Ativo") === "Ativo";
}

export function SistemasFerramentasSection() {
  const sistemas = useAppStore((s) => s.sistemasEscritorio);
  const deleteSistemaEscritorio = useAppStore((s) => s.deleteSistemaEscritorio);

  const [view, setView] = useState<"todos" | "departamento">("todos");
  const [revealedSenhas, setRevealedSenhas] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sistemaFormOpen, setSistemaFormOpen] = useState(false);
  const [editingSistema, setEditingSistema] = useState<SistemaEscritorio | null>(null);
  // Contador que muda a cada abertura, forçando o SistemaFormDialog a
  // remontar (senão reabrir o MESMO sistema logo após editá-lo reaproveita a
  // instância que o próprio dialog já tinha zerado ao fechar — mesmo bug já
  // corrigido no Scripts/Certificados).
  const [formOpenKey, setFormOpenKey] = useState(0);

  const totalMensalAtivos = sistemas.filter(isAtivo).reduce((acc, s) => acc + (s.valorMensal ?? 0), 0);
  const ativos = sistemas.filter(isAtivo).length;

  const grupos = useMemo(
    () =>
      SETORES_SISTEMA.map((setor) => ({
        setor,
        sistemas: sistemas.filter((s) => (s.setores ?? []).includes(setor)),
      })).filter((g) => g.sistemas.length > 0),
    [sistemas]
  );

  function toggleSenha(id: string) {
    setRevealedSenhas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function copiarSenha(sis: SistemaEscritorio) {
    if (!sis.senha) return;
    try {
      await navigator.clipboard.writeText(sis.senha);
      setCopiedId(sis.id);
      setTimeout(() => setCopiedId((cur) => (cur === sis.id ? null : cur)), 2000);
    } catch {
      // clipboard indisponível
    }
  }

  function openNovoSistema() {
    setEditingSistema(null);
    setFormOpenKey((k) => k + 1);
    setSistemaFormOpen(true);
  }
  function openEditSistema(sis: SistemaEscritorio) {
    setEditingSistema(sis);
    setFormOpenKey((k) => k + 1);
    setSistemaFormOpen(true);
  }
  function handleDeleteSistema(sis: SistemaEscritorio) {
    if (!confirm(`Excluir o sistema "${sis.nome}"?`)) return;
    deleteSistemaEscritorio(sis.id);
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Sistemas e ferramentas</CardTitle>
          <p className="mt-1 text-xs text-sand-500">
            Ferramentas e portais que o escritório assina, com login, senha e cobrança mensal.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openNovoSistema}>
          <Plus className="size-3.5" /> Novo sistema
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricCard label="Sistemas e ferramentas" value={sistemas.length} icon={Layers} tone="wine" />
          <MetricCard label="Gasto mensal total" value={formatCurrency(totalMensalAtivos)} icon={Wallet} hint="soma dos ativos" tone="neutral" />
          <MetricCard label="Ativos" value={ativos} icon={CheckCircle2} tone="success" />
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as "todos" | "departamento")}>
          <TabsList>
            <TabsTrigger value="todos">Todos os sistemas</TabsTrigger>
            <TabsTrigger value="departamento">Por departamento</TabsTrigger>
          </TabsList>
        </Tabs>

        {view === "todos" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sistema</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Senha</TableHead>
                <TableHead>Valor mensal</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sistemas.map((sis) => (
                <TableRow key={sis.id}>
                  <TableCell>
                    <span className="font-medium text-sand-900">{sis.nome}</span>
                    {sis.link && (
                      <a
                        href={sis.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center text-wine-700 hover:underline"
                        title={sis.link}
                      >
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(sis.setores ?? []).length > 0
                        ? sis.setores!.map((s) => (
                            <span key={s} className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-medium text-sand-600">
                              {s}
                            </span>
                          ))
                        : "—"}
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={sis.situacao ?? "Ativo"} /></TableCell>
                  <TableCell className="text-sand-600">{sis.login || "—"}</TableCell>
                  <TableCell>
                    {sis.senha ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sand-700">{revealedSenhas.has(sis.id) ? sis.senha : "••••••••"}</span>
                        <button type="button" onClick={() => toggleSenha(sis.id)} className="text-sand-400 hover:text-sand-700" title={revealedSenhas.has(sis.id) ? "Ocultar senha" : "Mostrar senha"}>
                          {revealedSenhas.has(sis.id) ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                        <button type="button" onClick={() => copiarSenha(sis)} className="text-sand-400 hover:text-sand-700" title="Copiar senha">
                          {copiedId === sis.id ? <Check className="size-3.5 text-status-success" /> : <Copy className="size-3.5" />}
                        </button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-sand-700">{sis.valorMensal ? formatCurrency(sis.valorMensal) : "sem custo"}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => openEditSistema(sis)} title="Editar" className="rounded-md p-1.5 text-sand-400 hover:bg-sand-100 hover:text-sand-700">
                        <Pencil className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDeleteSistema(sis)} title="Excluir" className="rounded-md p-1.5 text-sand-400 hover:bg-status-danger-bg hover:text-status-danger">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sistemas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sand-400">
                    Nenhum sistema cadastrado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {grupos.map(({ setor, sistemas: doSetor }) => (
              <div key={setor} className="w-64 shrink-0">
                <div className="mb-2 flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-sand-500">{setor}</h3>
                  <span className="text-[11px] font-medium text-sand-400">{doSetor.length}</span>
                </div>
                <div className="space-y-2">
                  {doSetor.map((sis) => (
                    <button
                      key={sis.id}
                      type="button"
                      onClick={() => openEditSistema(sis)}
                      className="block w-full rounded-xl border border-sand-200 bg-white p-3 text-left transition-colors hover:border-wine-300"
                    >
                      <p className="truncate text-sm font-medium text-sand-900">{sis.nome}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <StatusBadge status={sis.situacao ?? "Ativo"} />
                        <span className="text-[11px] text-sand-500">
                          {sis.valorMensal ? `${formatCurrency(sis.valorMensal)}/mês` : "sem custo"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {grupos.length === 0 && (
              <p className="w-full py-8 text-center text-xs text-sand-400">
                Nenhum sistema com setor marcado ainda — edite um sistema e escolha o setor.
              </p>
            )}
          </div>
        )}
      </CardContent>

      <SistemaFormDialog key={formOpenKey} open={sistemaFormOpen} onOpenChange={setSistemaFormOpen} sistema={editingSistema} />
    </Card>
  );
}
