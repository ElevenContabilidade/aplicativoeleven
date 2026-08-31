"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Lead, LeadOrigem, ServicoInteresse } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/lib/store/app-store";
import { createClientFromLead } from "@/lib/actions/convert-lead";

const SERVICOS: ServicoInteresse[] = [
  "Contabilidade mensal",
  "Abertura de empresa",
  "Alteração empresarial",
  "Regularização",
  "Desenquadramento MEI",
  "Planejamento tributário",
  "Departamento pessoal",
  "Certificado digital",
  "Consultoria",
];

const ORIGENS: LeadOrigem[] = ["Instagram", "Google", "Site", "WhatsApp", "Indicação", "Prospecção ativa", "Parceiro", "Evento", "Outro"];

export function LeadDetailDialog({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const router = useRouter();
  const addClient = useAppStore((s) => s.addClient);
  const clients = useAppStore((s) => s.clients);
  const leads = useAppStore((s) => s.leads);
  const updateLead = useAppStore((s) => s.updateLead);
  const deleteLead = useAppStore((s) => s.deleteLead);
  const alreadyClient = lead ? clients.some((c) => c.leadOrigemId === lead.id) : false;

  const [form, setForm] = useState<Lead | null>(lead);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [novoServico, setNovoServico] = useState("");

  const servicosCadastrados = useMemo(
    () => [...new Set(leads.flatMap((l) => l.servicosInteresse))].filter((s) => !SERVICOS.includes(s)).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [leads]
  );
  const todosServicos = [...SERVICOS, ...servicosCadastrados];

  if (!lead || !form) return null;

  function set<K extends keyof Lead>(key: K, value: Lead[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function toggleServico(s: ServicoInteresse) {
    setForm((f) =>
      f ? { ...f, servicosInteresse: f.servicosInteresse.includes(s) ? f.servicosInteresse.filter((x) => x !== s) : [...f.servicosInteresse, s] } : f
    );
  }

  function adicionarServico() {
    const nome = novoServico.trim();
    if (!nome || todosServicos.includes(nome)) return;
    setForm((f) => (f ? { ...f, servicosInteresse: [...f.servicosInteresse, nome] } : f));
    setNovoServico("");
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    updateLead(form.id, form);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  function handleDelete() {
    if (!lead) return;
    if (confirm(`Excluir o lead "${lead.nome}"? Essa ação não pode ser desfeita.`)) {
      deleteLead(lead.id);
      onClose();
    }
  }

  function handleConvert() {
    if (!lead) return;
    const client = createClientFromLead(lead);
    addClient(client);
    onClose();
    router.push(`/clientes/${client.id}`);
  }

  return (
    <Dialog open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{lead.nome}</DialogTitle>
            <StatusBadge status={lead.stage} />
          </div>
          <p className="text-xs text-sand-500">{lead.empresa}</p>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Field label="Nome" className="col-span-2">
              <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} />
            </Field>
            <Field label="Empresa" className="col-span-2">
              <Input value={form.empresa ?? ""} onChange={(e) => set("empresa", e.target.value)} />
            </Field>
            <Field label="Telefone">
              <Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} />
            </Field>
            <Field label="E-mail">
              <Input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Cidade">
              <Input value={form.cidade} onChange={(e) => set("cidade", e.target.value)} />
            </Field>
            <Field label="Estado">
              <Input value={form.estado} maxLength={2} onChange={(e) => set("estado", e.target.value.toUpperCase())} />
            </Field>
            <Field label="Origem">
              <Select value={form.origem} onValueChange={(v) => set("origem", v as LeadOrigem)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORIGENS.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Segmento">
              <Input value={form.segmento ?? ""} onChange={(e) => set("segmento", e.target.value)} />
            </Field>
            <Field label="Valor estimado (R$)">
              <Input type="number" value={form.valorEstimado} onChange={(e) => set("valorEstimado", Number(e.target.value))} />
            </Field>
            <Field label="Faturamento estimado (R$)">
              <Input
                type="number"
                value={form.faturamentoEstimado ?? ""}
                onChange={(e) => set("faturamentoEstimado", e.target.value ? Number(e.target.value) : undefined)}
              />
            </Field>
            <Field label="Regime tributário atual">
              <Input value={form.regimeTributarioAtual ?? ""} onChange={(e) => set("regimeTributarioAtual", e.target.value)} />
            </Field>
            <Field label="Próxima ação">
              <Input value={form.proximaAcao ?? ""} onChange={(e) => set("proximaAcao", e.target.value)} />
            </Field>
          </div>

          <div>
            <Label className="mb-1.5 block">Serviços de interesse</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {todosServicos.map((s) => (
                <label key={s} className="flex items-center gap-2 text-xs text-sand-700">
                  <Checkbox checked={form.servicosInteresse.includes(s)} onCheckedChange={() => toggleServico(s)} />
                  {s}
                </label>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                value={novoServico}
                onChange={(e) => setNovoServico(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionarServico(); } }}
                placeholder="Cadastrar novo serviço…"
                className="h-8 text-xs"
              />
              <Button type="button" size="icon" variant="outline" onClick={adicionarServico} className="h-8 w-8 shrink-0">
                <Plus className="size-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {form.servicosInteresse.map((s) => (
              <Badge key={s} variant="cream">{s}</Badge>
            ))}
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold text-sand-700">Histórico</p>
            <div className="max-h-32 space-y-2 overflow-y-auto scrollbar-thin">
              <div className="text-[11px] text-sand-500">
                <span className="font-medium text-sand-700">{formatDate(lead.dataEntrada)}</span> — Lead cadastrado
              </div>
              {lead.historico.map((h) => (
                <div key={h.id} className="text-[11px] text-sand-500">
                  <span className="font-medium text-sand-700">{formatDateTime(h.data)}</span> — {h.autor}: {h.descricao}
                </div>
              ))}
              {lead.historico.length === 0 && <p className="text-[11px] text-sand-400">Sem movimentações registradas ainda.</p>}
            </div>
          </div>

          <DialogFooter className="flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={handleDelete} className="text-status-danger hover:bg-status-danger-bg">
                <Trash2 className="size-3.5" /> Excluir
              </Button>
              {savedAt && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-status-success">
                  <Check className="size-3.5" /> Salvo
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {lead.stage === "Fechado" && !alreadyClient && (
                <Button type="button" variant="secondary" onClick={handleConvert}>Converter em cliente</Button>
              )}
              {alreadyClient && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push(`/clientes/${clients.find((c) => c.leadOrigemId === lead.id)?.id}`)}
                >
                  Ver cliente
                </Button>
              )}
              <Button type="submit">Salvar alterações</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
