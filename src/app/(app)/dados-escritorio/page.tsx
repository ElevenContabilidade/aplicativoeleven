"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Copy, Pencil, Trash2, Plus, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SistemaFormDialog } from "@/components/office/sistema-form-dialog";
import { useAppStore } from "@/lib/store/app-store";
import type { DadosEscritorio, SistemaEscritorio } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function DadosEscritorioPage() {
  const dadosEscritorio = useAppStore((s) => s.dadosEscritorio);
  const updateDadosEscritorio = useAppStore((s) => s.updateDadosEscritorio);
  const sistemas = useAppStore((s) => s.sistemasEscritorio);
  const deleteSistemaEscritorio = useAppStore((s) => s.deleteSistemaEscritorio);
  const [form, setForm] = useState<DadosEscritorio>(dadosEscritorio);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [revealedSenhas, setRevealedSenhas] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sistemaFormOpen, setSistemaFormOpen] = useState(false);
  const [editingSistema, setEditingSistema] = useState<SistemaEscritorio | null>(null);

  function set<K extends keyof DadosEscritorio>(key: K, value: DadosEscritorio[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateDadosEscritorio(form);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

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
    setSistemaFormOpen(true);
  }
  function openEditSistema(sis: SistemaEscritorio) {
    setEditingSistema(sis);
    setSistemaFormOpen(true);
  }
  function handleDeleteSistema(sis: SistemaEscritorio) {
    if (!confirm(`Excluir o sistema "${sis.nome}"?`)) return;
    deleteSistemaEscritorio(sis.id);
  }

  const totalMensal = sistemas.reduce((acc, s) => acc + (s.valorMensal ?? 0), 0);

  return (
    <div className="max-w-5xl">
      <PageHeader title="Dados do escritório" description="Informações cadastrais e de contato da Eleven, exibidas na plataforma." />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 pt-4 text-xs sm:grid-cols-2">
            <Field label="Razão social" className="sm:col-span-2">
              <Input value={form.razaoSocial} onChange={(e) => set("razaoSocial", e.target.value)} />
            </Field>
            <Field label="Nome fantasia">
              <Input value={form.nomeFantasia} onChange={(e) => set("nomeFantasia", e.target.value)} />
            </Field>
            <Field label="CNPJ">
              <Input value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
            </Field>
            <Field label="Inscrição municipal">
              <Input value={form.inscricaoMunicipal ?? ""} onChange={(e) => set("inscricaoMunicipal", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contato</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 pt-4 text-xs sm:grid-cols-2">
            <Field label="Telefone">
              <Input value={form.telefone ?? ""} onChange={(e) => set("telefone", e.target.value)} placeholder="(00) 0000-0000" />
            </Field>
            <Field label="WhatsApp">
              <Input value={form.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} placeholder="(00) 00000-0000" />
            </Field>
            <Field label="E-mail">
              <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Site">
              <Input type="url" value={form.site ?? ""} onChange={(e) => set("site", e.target.value)} placeholder="https://" />
            </Field>
            <Field label="Instagram" className="sm:col-span-2">
              <Input value={form.instagram ?? ""} onChange={(e) => set("instagram", e.target.value)} placeholder="@somoseleven" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Endereço</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 pt-4 text-xs sm:grid-cols-2">
            <Field label="Endereço" className="sm:col-span-2">
              <Input value={form.endereco ?? ""} onChange={(e) => set("endereco", e.target.value)} placeholder="Rua, número, bairro" />
            </Field>
            <Field label="Cidade">
              <Input value={form.cidade ?? ""} onChange={(e) => set("cidade", e.target.value)} />
            </Field>
            <Field label="Estado (UF)">
              <Input value={form.estado ?? ""} maxLength={2} onChange={(e) => set("estado", e.target.value.toUpperCase())} />
            </Field>
            <Field label="CEP">
              <Input value={form.cep ?? ""} onChange={(e) => set("cep", e.target.value)} placeholder="00000-000" />
            </Field>
            <Field label="Horário de atendimento">
              <Input value={form.horarioAtendimento ?? ""} onChange={(e) => set("horarioAtendimento", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm">Salvar alterações</Button>
          {savedAt && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-status-success">
              <Check className="size-3.5" /> Dados salvos
            </span>
          )}
        </div>
      </form>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Sistemas e acessos</CardTitle>
            <p className="mt-1 text-xs text-sand-500">
              Ferramentas e portais que o escritório assina, com login, senha e cobrança mensal.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {totalMensal > 0 && (
              <span className="text-xs text-sand-500">
                Total mensal: <span className="font-semibold text-sand-800">{formatCurrency(totalMensal)}</span>
              </span>
            )}
            <Button type="button" size="sm" onClick={openNovoSistema}>
              <Plus className="size-3.5" /> Novo sistema
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sistema</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Senha</TableHead>
                <TableHead>Valor mensal</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sistemas.map((sis) => (
                <TableRow key={sis.id}>
                  <TableCell>
                    <span className="font-medium text-sand-900">{sis.nome}</span>
                  </TableCell>
                  <TableCell>
                    {sis.link ? (
                      <a
                        href={sis.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-wine-700 hover:underline"
                      >
                        {sis.link.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
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
                  <TableCell className="text-sand-700">{sis.valorMensal ? formatCurrency(sis.valorMensal) : "—"}</TableCell>
                  <TableCell className="text-sand-600">{sis.diaVencimento ? `Dia ${sis.diaVencimento}` : "—"}</TableCell>
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
        </CardContent>
      </Card>

      <SistemaFormDialog open={sistemaFormOpen} onOpenChange={setSistemaFormOpen} sistema={editingSistema} />
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-1 block">{label}</Label>
      {children}
    </div>
  );
}
