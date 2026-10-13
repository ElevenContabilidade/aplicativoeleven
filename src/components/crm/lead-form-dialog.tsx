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
import { formatBytes } from "@/lib/utils";
import type { Lead, LeadOrigem, ServicoInteresse } from "@/lib/types";

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

export function LeadFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addLead = useAppStore((s) => s.addLead);
  const leads = useAppStore((s) => s.leads);
  const team = useAppStore((s) => s.team);
  const { userId } = useAuthStore();

  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [segmento, setSegmento] = useState("");
  const [origem, setOrigem] = useState<LeadOrigem>("Site");
  const [valorEstimado, setValorEstimado] = useState("");
  const [valorAssessoriaMensal, setValorAssessoriaMensal] = useState("");
  const [observacoes, setObservacoes] = useState("");
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
    setNome(""); setEmpresa(""); setTelefone(""); setEmail(""); setCidade(""); setEstado("");
    setSegmento(""); setOrigem("Site"); setValorEstimado(""); setValorAssessoriaMensal("");
    setObservacoes(""); setPropostaFile(null); setErro(null); setServicos([]); setNovoServico("");
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
      servicosInteresse: servicos,
      origem,
      stage: "Lead recebido",
      responsavelId: userId ?? team[0]?.id ?? "",
      valorEstimado: Number(valorEstimado) || 0,
      valorAssessoriaMensal: valorAssessoriaMensal ? Number(valorAssessoriaMensal) : undefined,
      dataUltimoContato: today,
      dataEntrada: today,
      observacoes: observacoes.trim() || undefined,
      propostaNome: proposta?.nome,
      propostaUrl: proposta?.url,
      historico: [],
    };
    addLead(lead);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo lead</DialogTitle>
          <DialogDescription>Cadastre um novo lead para iniciar a jornada comercial.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-sand-400">Dados principais</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome *" className="col-span-2">
                <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
              </Field>
              <Field label="Empresa" className="col-span-2">
                <Input value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
              </Field>
              <Field label="Telefone *">
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} required placeholder="(11) 90000-0000" />
              </Field>
              <Field label="E-mail">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="Cidade">
                <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
              </Field>
              <Field label="Estado">
                <Input value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase())} maxLength={2} />
              </Field>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-sand-400">Perfil</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Segmento" className="col-span-2">
                <Input value={segmento} onChange={(e) => setSegmento(e.target.value)} placeholder="Ex: Clínica odontológica" />
              </Field>
              <Field label="Valor estimado (R$)">
                <Input type="number" value={valorEstimado} onChange={(e) => setValorEstimado(e.target.value)} />
              </Field>
              <Field label="Valor da assessoria mensal (R$)">
                <Input type="number" value={valorAssessoriaMensal} onChange={(e) => setValorAssessoriaMensal(e.target.value)} />
              </Field>
              <Field label="Origem do lead" className="col-span-2">
                <Select value={origem} onValueChange={(v) => setOrigem(v as LeadOrigem)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORIGENS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Observação" className="col-span-2">
                <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} />
              </Field>
              <Field label="Proposta enviada" className="col-span-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-sand-300 bg-sand-50 px-3 py-2 text-xs text-sand-600 hover:border-wine-400 hover:bg-wine-50">
                  <FileUp className="size-3.5 shrink-0 text-wine-500" />
                  {propostaFile ? `${propostaFile.name} (${formatBytes(propostaFile.size)})` : "Clique para anexar a proposta (PDF ou outro arquivo)"}
                  <input type="file" className="hidden" onChange={(e) => setPropostaFile(e.target.files?.[0] ?? null)} />
                </label>
              </Field>
            </div>
          </div>

          {erro && <p className="text-xs text-status-danger">{erro}</p>}

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-sand-400">Interesse</p>
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

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-1 block">{label}</Label>
      {children}
    </div>
  );
}
