"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileUp, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { LEAD_STAGES, type Lead, type LeadOrigem, type LeadStage, type ServicoInteresse, type TipoServicoLead } from "@/lib/types";
import { formatBytes, formatDate, formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/team-lookup";
import { createClientFromLead } from "@/lib/actions/convert-lead";
import { idIndicacaoDoLead, sincronizarIndicacaoDoLead } from "@/lib/actions/sincronizar-indicacao-lead";
import { uploadPropostaLead } from "@/lib/upload-proposta-lead";
import { conducaoPadrao, ConducaoChecklist } from "@/components/crm/lead-conducao";
import { LeadReuniaoFields } from "@/components/crm/lead-reuniao-fields";

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
const TIPOS_SERVICO: TipoServicoLead[] = ["Recorrente", "Esporádico"];
const MESES_NOME = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];

function mesReferencia(dataIso: string): string {
  if (!dataIso) return "—";
  const [, mesStr] = dataIso.split("-");
  const mes = Number(mesStr);
  if (!mes) return "—";
  return `${mesStr}. ${MESES_NOME[mes - 1]}`;
}

export function LeadDetailDialog({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const router = useRouter();
  const addClient = useAppStore((s) => s.addClient);
  const clients = useAppStore((s) => s.clients);
  const leads = useAppStore((s) => s.leads);
  const team = useAppStore((s) => s.team);
  const servicosPortfolio = useAppStore((s) => s.servicosPortfolio);
  const updateLead = useAppStore((s) => s.updateLead);
  const deleteLead = useAppStore((s) => s.deleteLead);
  const indicacoes = useAppStore((s) => s.indicacoes);
  const addIndicacao = useAppStore((s) => s.addIndicacao);
  const updateIndicacao = useAppStore((s) => s.updateIndicacao);
  const deleteIndicacao = useAppStore((s) => s.deleteIndicacao);
  const alreadyClient = lead ? clients.some((c) => c.leadOrigemId === lead.id) : false;

  const [form, setForm] = useState<Lead | null>(lead);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [novoServico, setNovoServico] = useState("");
  const [propostaFile, setPropostaFile] = useState<File | null>(null);
  const [enviandoProposta, setEnviandoProposta] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    setErro(null);
    let dadosFinais = form;
    if (propostaFile) {
      setEnviandoProposta(true);
      try {
        const proposta = await uploadPropostaLead({ file: propostaFile, leadId: form.id, leadNome: form.nome });
        dadosFinais = { ...form, propostaNome: proposta.nome, propostaUrl: proposta.url };
        setForm(dadosFinais);
        setPropostaFile(null);
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Não foi possível enviar a proposta.");
        setEnviandoProposta(false);
        return;
      }
      setEnviandoProposta(false);
    }

    updateLead(dadosFinais.id, dadosFinais);
    sincronizarIndicacaoDoLead(dadosFinais, indicacoes, { addIndicacao, updateIndicacao, deleteIndicacao });
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  function handleDelete() {
    if (!lead) return;
    if (confirm(`Excluir o lead "${lead.nome}"? Essa ação não pode ser desfeita.`)) {
      deleteLead(lead.id);
      if (indicacoes.some((i) => i.id === idIndicacaoDoLead(lead.id))) deleteIndicacao(idIndicacaoDoLead(lead.id));
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
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{lead.nome}</DialogTitle>
            <StatusBadge status={lead.stage} />
          </div>
          <p className="text-xs text-sand-500">{lead.empresa}</p>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <Secao titulo="Identificação">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome" className="col-span-2">
                <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} />
              </Field>
              <Field label="Empresa" className="col-span-2">
                <Input value={form.empresa ?? ""} onChange={(e) => set("empresa", e.target.value)} />
              </Field>
              <Field label="Status de atendimento" className="col-span-2">
                <Select value={form.stage} onValueChange={(v) => set("stage", v as LeadStage)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_STAGES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              </Field>
              {form.stage === "Perdido" && (
                <Field label="Motivo da perda" className="col-span-2">
                  <Input value={form.motivoPerda ?? ""} onChange={(e) => set("motivoPerda", e.target.value)} placeholder="Ex: Fechou com outro escritório" />
                </Field>
              )}
              <Field label="Telefone">
                <Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} />
              </Field>
              <Field label="Primeiro contato">
                <Input type="date" value={form.dataEntrada} onChange={(e) => set("dataEntrada", e.target.value)} />
                <p className="mt-1 text-[10px] text-sand-400">Mês referência: {mesReferencia(form.dataEntrada)} (automático)</p>
              </Field>
              <Field label="De onde veio">
                <Select value={form.origem} onValueChange={(v) => set("origem", v as LeadOrigem)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORIGENS.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Cidade">
                <Input value={form.cidade} onChange={(e) => set("cidade", e.target.value)} />
              </Field>
              <Field label="Estado">
                <Input value={form.estado} maxLength={2} onChange={(e) => set("estado", e.target.value.toUpperCase())} />
              </Field>
              <Field label="E-mail">
                <Input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field label="Responsável pelo cadastro" className="col-span-2">
                <Select value={form.responsavelId} onValueChange={(v) => set("responsavelId", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {team.map((m) => (<SelectItem key={m.id} value={m.id}>{teamName(m.id)}</SelectItem>))}
                  </SelectContent>
                </Select>
              </Field>
              {form.origem === "Indicação" && (
                <>
                  <Field label="Cliente que indicou">
                    <Select value={form.clienteIndicadorId ?? ""} onValueChange={(v) => set("clienteIndicadorId", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.dados.razaoSocial}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="% de comissão">
                    <Input
                      type="number"
                      value={form.comissaoIndicacaoPercentual ?? ""}
                      onChange={(e) => set("comissaoIndicacaoPercentual", e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </Field>
                </>
              )}
            </div>
          </Secao>

          <Secao titulo="Qualificação">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Serviço (do portfólio)" className="col-span-2">
                <Select value={form.servicoPortfolioId ?? "nenhum"} onValueChange={(v) => set("servicoPortfolioId", v === "nenhum" ? undefined : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione um serviço" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">—</SelectItem>
                    {servicosPortfolio.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        {sp.numero ? `${String(sp.numero).padStart(2, "0")}. ` : ""}
                        {sp.nome}
                        {sp.categoria ? ` (${sp.categoria})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Valor estimado (R$)">
                <Input type="number" value={form.valorEstimado} onChange={(e) => set("valorEstimado", Number(e.target.value))} />
              </Field>
              <Field label="Valor da assessoria mensal (R$)">
                <Input
                  type="number"
                  value={form.valorAssessoriaMensal ?? ""}
                  onChange={(e) => set("valorAssessoriaMensal", e.target.value ? Number(e.target.value) : undefined)}
                />
              </Field>
              <Field label="Tipo de serviço">
                <Select value={form.tipoServico ?? "nenhum"} onValueChange={(v) => set("tipoServico", v === "nenhum" ? undefined : (v as TipoServicoLead))}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">—</SelectItem>
                    {TIPOS_SERVICO.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Segmento">
                <Input value={form.segmento ?? ""} onChange={(e) => set("segmento", e.target.value)} />
              </Field>
              <Field label="Média de faturamento mensal">
                <Input
                  type="number"
                  value={form.faturamentoEstimado ?? ""}
                  onChange={(e) => set("faturamentoEstimado", e.target.value ? Number(e.target.value) : undefined)}
                />
              </Field>
              <Field label="Quantidade de sócios">
                <Input
                  type="number"
                  min="0"
                  value={form.quantidadeSocios ?? ""}
                  onChange={(e) => set("quantidadeSocios", e.target.value ? Number(e.target.value) : undefined)}
                />
              </Field>
              <Field label="Quantidade de funcionários">
                <Input
                  type="number"
                  min="0"
                  value={form.numeroFuncionarios ?? ""}
                  onChange={(e) => set("numeroFuncionarios", e.target.value ? Number(e.target.value) : undefined)}
                />
              </Field>
              <Field label="Já tem CNPJ?">
                <Select
                  value={form.jaTemCnpj === undefined ? "nenhum" : form.jaTemCnpj ? "sim" : "nao"}
                  onValueChange={(v) => set("jaTemCnpj", v === "nenhum" ? undefined : v === "sim")}
                >
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">—</SelectItem>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="CNPJ">
                <Input value={form.cnpj ?? ""} onChange={(e) => set("cnpj", e.target.value)} />
              </Field>
              <Field label="Regime tributário atual">
                <Input value={form.regimeTributarioAtual ?? ""} onChange={(e) => set("regimeTributarioAtual", e.target.value)} />
              </Field>
              <Field label="Próxima ação">
                <Input value={form.proximaAcao ?? ""} onChange={(e) => set("proximaAcao", e.target.value)} />
              </Field>
            </div>
            <div className="mt-3">
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
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.servicosInteresse.map((s) => (
                  <Badge key={s} variant="cream">{s}</Badge>
                ))}
              </div>
            </div>
          </Secao>

          <Secao titulo="Informações adicionais">
            <div className="grid grid-cols-2 gap-3">
              <Field label="CPF">
                <Input value={form.cpf ?? ""} onChange={(e) => set("cpf", e.target.value)} />
              </Field>
              <Field label="Senha GOV">
                <Input value={form.senhaGov ?? ""} onChange={(e) => set("senhaGov", e.target.value)} />
              </Field>
            </div>
          </Secao>

          <Secao titulo="Observações de atendimento">
            <Textarea value={form.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)} rows={3} placeholder="Anotações livres sobre o atendimento" />
          </Secao>

          <Secao titulo="Reunião">
            <LeadReuniaoFields reuniao={form.reuniao} onChange={(r) => set("reuniao", r)} />
          </Secao>

          <Secao titulo="Propostas e condução">
            <Field label="Proposta enviada" className="mb-3 block">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-sand-300 bg-sand-50 px-3 py-2 text-xs text-sand-600 hover:border-wine-400 hover:bg-wine-50">
                <FileUp className="size-3.5 shrink-0 text-wine-500" />
                {propostaFile
                  ? `${propostaFile.name} (${formatBytes(propostaFile.size)})`
                  : form.propostaNome ?? "Clique para anexar a proposta (PDF ou outro arquivo)"}
                <input type="file" className="hidden" onChange={(e) => setPropostaFile(e.target.files?.[0] ?? null)} />
              </label>
              {form.propostaUrl && !propostaFile && (
                <a href={form.propostaUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[11px] text-wine-600 hover:underline">
                  Ver proposta no Drive
                </a>
              )}
            </Field>
            <ConducaoChecklist etapas={form.conducao ?? conducaoPadrao()} nomeLead={form.nome} onChange={(c) => set("conducao", c)} />
          </Secao>

          {erro && <p className="text-xs text-status-danger">{erro}</p>}

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
              <Button type="submit" disabled={enviandoProposta}>{enviandoProposta ? "Enviando proposta…" : "Salvar alterações"}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-sand-400">{titulo}</p>
      {children}
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
