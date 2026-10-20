"use client";

import { useMemo, useState } from "react";
import { FileUp, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { uploadPropostaLead } from "@/lib/upload-proposta-lead";
import { sincronizarIndicacaoDoLead } from "@/lib/actions/sincronizar-indicacao-lead";
import { conducaoPadrao, ConducaoChecklist } from "@/components/crm/lead-conducao";
import { LeadReuniaoFields } from "@/components/crm/lead-reuniao-fields";
import { teamName } from "@/lib/team-lookup";
import { formatBytes } from "@/lib/utils";
import { LEAD_STAGES, type EtapaConducaoLead, type Lead, type LeadOrigem, type LeadStage, type ReuniaoLead, type ServicoInteresse, type TipoServicoLead } from "@/lib/types";

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

export function LeadFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addLead = useAppStore((s) => s.addLead);
  const leads = useAppStore((s) => s.leads);
  const team = useAppStore((s) => s.team);
  const clients = useAppStore((s) => s.clients);
  const servicosPortfolio = useAppStore((s) => s.servicosPortfolio);
  const indicacoes = useAppStore((s) => s.indicacoes);
  const addIndicacao = useAppStore((s) => s.addIndicacao);
  const updateIndicacao = useAppStore((s) => s.updateIndicacao);
  const deleteIndicacao = useAppStore((s) => s.deleteIndicacao);
  const { userId } = useAuthStore();

  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [stage, setStage] = useState<LeadStage>("Lead recebido");
  const [motivoPerda, setMotivoPerda] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataEntrada, setDataEntrada] = useState(() => new Date().toISOString().slice(0, 10));
  const [email, setEmail] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [origem, setOrigem] = useState<LeadOrigem>("Site");
  const [responsavelId, setResponsavelId] = useState(() => userId ?? "");
  const [clienteIndicadorId, setClienteIndicadorId] = useState("");
  const [comissaoIndicacaoPercentual, setComissaoIndicacaoPercentual] = useState("");

  const [servicoPortfolioId, setServicoPortfolioId] = useState("");
  const [valorEstimado, setValorEstimado] = useState("");
  const [tipoServico, setTipoServico] = useState<TipoServicoLead | "">("");
  const [nicho, setNicho] = useState("");
  const [segmento, setSegmento] = useState("");
  const [valorAssessoriaMensal, setValorAssessoriaMensal] = useState("");
  const [faturamentoEstimado, setFaturamentoEstimado] = useState("");
  const [quantidadeSocios, setQuantidadeSocios] = useState("");
  const [numeroFuncionarios, setNumeroFuncionarios] = useState("");
  const [jaTemCnpj, setJaTemCnpj] = useState<"" | "sim" | "nao">("");
  const [cnpj, setCnpj] = useState("");
  const [regimeTributarioAtual, setRegimeTributarioAtual] = useState("");

  const [cpf, setCpf] = useState("");
  const [senhaGov, setSenhaGov] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [reuniao, setReuniao] = useState<ReuniaoLead | undefined>(undefined);
  const [conducao, setConducao] = useState<EtapaConducaoLead[]>(() => conducaoPadrao());

  const [propostaFile, setPropostaFile] = useState<File | null>(null);
  const [enviandoProposta, setEnviandoProposta] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [servicos, setServicos] = useState<ServicoInteresse[]>([]);
  const [novoServico, setNovoServico] = useState("");

  const servicosCadastrados = useMemo(
    () => [...new Set(leads.flatMap((l) => l.servicosInteresse))].filter((s) => !SERVICOS.includes(s)).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [leads]
  );
  const todosServicos = [...SERVICOS, ...servicosCadastrados];

  function toggleServico(s: ServicoInteresse) {
    setServicos((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function adicionarServico() {
    const nome = novoServico.trim();
    if (!nome || todosServicos.includes(nome)) return;
    setServicos((prev) => [...prev, nome]);
    setNovoServico("");
  }

  function reset() {
    setNome(""); setEmpresa(""); setStage("Lead recebido"); setMotivoPerda(""); setTelefone("");
    setDataEntrada(new Date().toISOString().slice(0, 10)); setEmail(""); setCidade(""); setEstado("");
    setOrigem("Site"); setResponsavelId(userId ?? ""); setClienteIndicadorId(""); setComissaoIndicacaoPercentual("");
    setServicoPortfolioId(""); setValorEstimado(""); setTipoServico(""); setNicho(""); setSegmento("");
    setValorAssessoriaMensal(""); setFaturamentoEstimado(""); setQuantidadeSocios(""); setNumeroFuncionarios("");
    setJaTemCnpj(""); setCnpj(""); setRegimeTributarioAtual("");
    setCpf(""); setSenhaGov(""); setObservacoes("");
    setReuniao(undefined); setConducao(conducaoPadrao());
    setPropostaFile(null); setErro(null); setServicos([]); setNovoServico("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !telefone) return;
    const today = new Date().toISOString().slice(0, 10);
    const id = `l-${Date.now()}`;

    setErro(null);
    let proposta: { nome: string; url: string } | undefined;
    if (propostaFile) {
      setEnviandoProposta(true);
      try {
        proposta = await uploadPropostaLead({ file: propostaFile, leadId: id, leadNome: nome });
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Não foi possível enviar a proposta.");
        setEnviandoProposta(false);
        return;
      }
      setEnviandoProposta(false);
    }

    const lead: Lead = {
      id,
      nome,
      empresa: empresa || undefined,
      telefone,
      whatsapp: telefone,
      email: email || undefined,
      cidade: cidade || "—",
      estado: estado || "—",
      segmento: segmento || undefined,
      nicho: nicho || undefined,
      quantidadeSocios: quantidadeSocios ? Number(quantidadeSocios) : undefined,
      jaTemCnpj: jaTemCnpj === "" ? undefined : jaTemCnpj === "sim",
      tipoServico: tipoServico || undefined,
      servicoPortfolioId: servicoPortfolioId || undefined,
      cnpj: cnpj || undefined,
      cpf: cpf || undefined,
      senhaGov: senhaGov || undefined,
      regimeTributarioAtual: regimeTributarioAtual || undefined,
      faturamentoEstimado: faturamentoEstimado ? Number(faturamentoEstimado) : undefined,
      numeroFuncionarios: numeroFuncionarios ? Number(numeroFuncionarios) : undefined,
      servicosInteresse: servicos,
      origem,
      clienteIndicadorId: origem === "Indicação" && clienteIndicadorId ? clienteIndicadorId : undefined,
      comissaoIndicacaoPercentual: comissaoIndicacaoPercentual ? Number(comissaoIndicacaoPercentual) : undefined,
      stage,
      motivoPerda: stage === "Perdido" ? motivoPerda || undefined : undefined,
      responsavelId: responsavelId || team[0]?.id || "",
      valorEstimado: Number(valorEstimado) || 0,
      valorAssessoriaMensal: valorAssessoriaMensal ? Number(valorAssessoriaMensal) : undefined,
      dataUltimoContato: today,
      dataEntrada: dataEntrada || today,
      observacoes: observacoes.trim() || undefined,
      reuniao,
      conducao,
      propostaNome: proposta?.nome,
      propostaUrl: proposta?.url,
      historico: [],
    };
    addLead(lead);
    sincronizarIndicacaoDoLead(lead, indicacoes, { addIndicacao, updateIndicacao, deleteIndicacao });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo lead</DialogTitle>
          <DialogDescription>Cadastre um novo lead para iniciar a jornada comercial.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Secao titulo="Identificação">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome *" className="col-span-2">
                <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
              </Field>
              <Field label="Empresa" className="col-span-2">
                <Input value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
              </Field>
              <Field label="Status de atendimento" className="col-span-2">
                <Select value={stage} onValueChange={(v) => setStage(v as LeadStage)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_STAGES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              </Field>
              {stage === "Perdido" && (
                <Field label="Motivo da perda" className="col-span-2">
                  <Input value={motivoPerda} onChange={(e) => setMotivoPerda(e.target.value)} placeholder="Ex: Fechou com outro escritório" />
                </Field>
              )}
              <Field label="Telefone *">
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} required placeholder="(11) 90000-0000" />
              </Field>
              <Field label="Primeiro contato">
                <Input type="date" value={dataEntrada} onChange={(e) => setDataEntrada(e.target.value)} />
                <p className="mt-1 text-[10px] text-sand-400">Mês referência: {mesReferencia(dataEntrada)} (automático)</p>
              </Field>
              <Field label="De onde veio">
                <Select value={origem} onValueChange={(v) => setOrigem(v as LeadOrigem)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORIGENS.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Cidade">
                <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
              </Field>
              <Field label="Estado (UF)">
                <Input value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase())} maxLength={2} />
              </Field>
              <Field label="E-mail">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="Responsável pelo cadastro" className="col-span-2">
                <Select value={responsavelId} onValueChange={setResponsavelId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {team.map((m) => (<SelectItem key={m.id} value={m.id}>{teamName(m.id)}</SelectItem>))}
                  </SelectContent>
                </Select>
              </Field>
              {origem === "Indicação" && (
                <>
                  <Field label="Cliente que indicou">
                    <Select value={clienteIndicadorId} onValueChange={setClienteIndicadorId}>
                      <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.dados.razaoSocial}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="% de comissão">
                    <Input type="number" value={comissaoIndicacaoPercentual} onChange={(e) => setComissaoIndicacaoPercentual(e.target.value)} />
                  </Field>
                </>
              )}
            </div>
          </Secao>

          <Secao titulo="Qualificação">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Serviço (do portfólio)" className="col-span-2">
                <Select value={servicoPortfolioId || "nenhum"} onValueChange={(v) => setServicoPortfolioId(v === "nenhum" ? "" : v)}>
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
                <Input type="number" value={valorEstimado} onChange={(e) => setValorEstimado(e.target.value)} />
              </Field>
              <Field label="Valor da assessoria mensal (R$)">
                <Input type="number" value={valorAssessoriaMensal} onChange={(e) => setValorAssessoriaMensal(e.target.value)} />
              </Field>
              <Field label="Tipo de serviço">
                <Select value={tipoServico || "nenhum"} onValueChange={(v) => setTipoServico(v === "nenhum" ? "" : (v as TipoServicoLead))}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">—</SelectItem>
                    {TIPOS_SERVICO.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Nicho">
                <Input value={nicho} onChange={(e) => setNicho(e.target.value)} placeholder="Ex: Designer" />
              </Field>
              <Field label="Segmento" className="col-span-2">
                <Input value={segmento} onChange={(e) => setSegmento(e.target.value)} placeholder="Ex: Clínica odontológica" />
              </Field>
              <Field label="Média de faturamento mensal">
                <Input type="number" value={faturamentoEstimado} onChange={(e) => setFaturamentoEstimado(e.target.value)} placeholder="Ex: R$ 8.000/mês" />
              </Field>
              <Field label="Quantidade de sócios">
                <Input type="number" min="0" value={quantidadeSocios} onChange={(e) => setQuantidadeSocios(e.target.value)} />
              </Field>
              <Field label="Quantidade de funcionários">
                <Input type="number" min="0" value={numeroFuncionarios} onChange={(e) => setNumeroFuncionarios(e.target.value)} />
              </Field>
              <Field label="Já tem CNPJ?">
                <Select value={jaTemCnpj || "nenhum"} onValueChange={(v) => setJaTemCnpj(v === "nenhum" ? "" : (v as "sim" | "nao"))}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">—</SelectItem>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="CNPJ">
                <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
              </Field>
              <Field label="Regime de tributação">
                <Input value={regimeTributarioAtual} onChange={(e) => setRegimeTributarioAtual(e.target.value)} />
              </Field>
            </div>
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] text-sand-500">Serviços de interesse</p>
              <div className="grid grid-cols-2 gap-2">
                {todosServicos.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-xs text-sand-700">
                    <Checkbox checked={servicos.includes(s)} onCheckedChange={() => toggleServico(s)} />
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
          </Secao>

          <Secao titulo="Informações adicionais">
            <div className="grid grid-cols-2 gap-3">
              <Field label="CPF">
                <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
              </Field>
              <Field label="Senha GOV">
                <Input value={senhaGov} onChange={(e) => setSenhaGov(e.target.value)} />
              </Field>
            </div>
          </Secao>

          <Secao titulo="Observações de atendimento">
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} placeholder="Anotações livres sobre o atendimento" />
          </Secao>

          <Secao titulo="Reunião">
            <LeadReuniaoFields reuniao={reuniao} onChange={setReuniao} />
          </Secao>

          <Secao titulo="Propostas e condução">
            <Field label="Proposta enviada" className="mb-3 block">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-sand-300 bg-sand-50 px-3 py-2 text-xs text-sand-600 hover:border-wine-400 hover:bg-wine-50">
                <FileUp className="size-3.5 shrink-0 text-wine-500" />
                {propostaFile ? `${propostaFile.name} (${formatBytes(propostaFile.size)})` : "Clique para anexar a proposta (PDF ou outro arquivo)"}
                <input type="file" className="hidden" onChange={(e) => setPropostaFile(e.target.files?.[0] ?? null)} />
              </label>
            </Field>
            <ConducaoChecklist etapas={conducao} nomeLead={nome} onChange={setConducao} />
          </Secao>

          {erro && <p className="text-xs text-status-danger">{erro}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviandoProposta}>{enviandoProposta ? "Enviando proposta…" : "Cadastrar lead"}</Button>
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
