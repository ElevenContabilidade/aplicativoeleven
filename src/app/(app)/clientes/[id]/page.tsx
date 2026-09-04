"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, ShieldCheck, Wallet, User, ClipboardCheck, Upload, Award, Share2, Trash2, Plus, Handshake, Pencil, Eye, EyeOff, Receipt, FolderOpen, X, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CadastroForm } from "@/components/clients/cadastro-form";
import { DepartmentNotesCard } from "@/components/clients/department-notes-card";
import { LicencaFormDialog } from "@/components/clients/licenca-form-dialog";
import { IndicacaoFormDialog } from "@/components/clients/indicacao-form-dialog";
import { SocioFormDialog } from "@/components/clients/socio-form-dialog";
import { ContatoFormDialog } from "@/components/clients/contato-form-dialog";
import { FinanceiroClienteForm } from "@/components/clients/financeiro-cliente-form";
import { ContratoAssinaturaCard } from "@/components/clients/contrato-assinatura-card";
import { HistoricoFinanceiroFormDialog } from "@/components/clients/historico-financeiro-form-dialog";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { DocumentActions } from "@/components/documents/document-actions";
import { PendenciasTab } from "@/components/clients/pendencias-tab";
import { TiposDocumentoRecorrenteCard } from "@/components/clients/tipos-documento-recorrente-card";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { teamName } from "@/lib/team-lookup";
import { CLIENT_STATUS, type ClientStatus, type Socio, type Contato, type HistoricoFinanceiro } from "@/lib/types";
import { isParcelamentoAtivo, parcelamentoPertenceAoCliente } from "@/lib/parcelamento";
import { recebimentoPertenceAoCliente } from "@/lib/recebimento";
import { resolveBoletoLedger } from "@/lib/boleto";
import { toneFor } from "@/lib/status";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

const MARKERS: Record<string, string> = { atencao: "⚠️ Atenção", estrategico: "⭐ Cliente estratégico", oportunidade: "💰 Oportunidade", documento: "📄 Documento pendente", urgente: "🚨 Urgente" };

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const clients = useAppStore((s) => s.clients);
  const tasks = useAppStore((s) => s.tasks);
  const obligations = useAppStore((s) => s.obligations);
  const documentos = useAppStore((s) => s.documentos);
  const certificados = useAppStore((s) => s.certificados);
  const timeline = useAppStore((s) => s.timeline);
  const anotacoes = useAppStore((s) => s.anotacoes);
  const licencas = useAppStore((s) => s.licencas);
  const indicacoes = useAppStore((s) => s.indicacoes);
  const parcelamentos = useAppStore((s) => s.parcelamentos);
  const recebimentos = useAppStore((s) => s.recebimentos);
  const boletosMensais = useAppStore((s) => s.boletosMensais);
  const recebimentosParceiro = useAppStore((s) => s.recebimentosParceiro);
  const toggleOnboardingItem = useAppStore((s) => s.toggleOnboardingItem);
  const addAnotacao = useAppStore((s) => s.addAnotacao);
  const deleteLicenca = useAppStore((s) => s.deleteLicenca);
  const deleteIndicacao = useAppStore((s) => s.deleteIndicacao);
  const deleteSocio = useAppStore((s) => s.deleteSocio);
  const deleteContato = useAppStore((s) => s.deleteContato);
  const deleteHistoricoCliente = useAppStore((s) => s.deleteHistoricoCliente);
  const deleteClient = useAppStore((s) => s.deleteClient);
  const updateClientStatus = useAppStore((s) => s.updateClientStatus);
  const updateClientTags = useAppStore((s) => s.updateClientTags);
  const { userId, kind } = useAuthStore();
  const team = useAppStore((s) => s.team);
  const [noteText, setNoteText] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [docUploadOpen, setDocUploadOpen] = useState(false);
  const [sincronizandoDrive, setSincronizandoDrive] = useState(false);
  const [sincronizarErro, setSincronizarErro] = useState<string | null>(null);
  const [sincronizarInfo, setSincronizarInfo] = useState<string | null>(null);
  const [licencaOpen, setLicencaOpen] = useState(false);
  const [indicacaoOpen, setIndicacaoOpen] = useState(false);
  const [socioOpen, setSocioOpen] = useState(false);
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null);
  const [socioSession, setSocioSession] = useState(0);
  const [contatoOpen, setContatoOpen] = useState(false);
  const [editingContato, setEditingContato] = useState<Contato | null>(null);
  const [contatoSession, setContatoSession] = useState(0);
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [editingHistorico, setEditingHistorico] = useState<HistoricoFinanceiro | null>(null);
  const [historicoSession, setHistoricoSession] = useState(0);
  const [revealedSenhas, setRevealedSenhas] = useState<Set<string>>(new Set());

  function openNovoSocio() {
    setEditingSocio(null);
    setSocioSession((n) => n + 1);
    setSocioOpen(true);
  }
  function openEditSocio(s: Socio) {
    setEditingSocio(s);
    setSocioSession((n) => n + 1);
    setSocioOpen(true);
  }
  function openNovoContato() {
    setEditingContato(null);
    setContatoSession((n) => n + 1);
    setContatoOpen(true);
  }
  function openEditContato(c: Contato) {
    setEditingContato(c);
    setContatoSession((n) => n + 1);
    setContatoOpen(true);
  }
  function openNovoLancamento() {
    setEditingHistorico(null);
    setHistoricoSession((n) => n + 1);
    setHistoricoOpen(true);
  }
  function openEditLancamento(h: HistoricoFinanceiro) {
    setEditingHistorico(h);
    setHistoricoSession((n) => n + 1);
    setHistoricoOpen(true);
  }
  function toggleSenha(id: string) {
    setRevealedSenhas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const client = clients.find((c) => c.id === id);
  if (!client) {
    return (
      <div className="py-20 text-center text-sand-400">
        Cliente não encontrado. <Link href="/clientes" className="text-wine-700 hover:underline">Voltar</Link>
      </div>
    );
  }

  const vinculados = kind === "equipe" ? team.find((m) => m.id === userId)?.clientesVinculados : undefined;
  if (vinculados && vinculados.length > 0 && !vinculados.includes(client.id)) {
    return (
      <div className="py-20 text-center text-sand-400">
        Você não tem acesso a este cliente. <Link href="/clientes" className="text-wine-700 hover:underline">Voltar</Link>
      </div>
    );
  }

  const myTasks = tasks.filter((t) => t.clienteId === client.id);
  const myObligations = obligations.filter((o) => o.clienteId === client.id);
  const myDocs = documentos.filter((d) => d.clienteId === client.id);
  const myCerts = certificados.filter((c) => c.clienteId === client.id);
  const myTimeline = timeline.filter((t) => t.clienteId === client.id);
  const myNotes = anotacoes.filter((n) => n.clienteId === client.id);
  const myLicencas = licencas.filter((l) => l.clienteId === client.id);
  const myIndicacoes = indicacoes.filter((i) => i.clienteId === client.id);
  const clienteRef = { nomeFantasia: client.dados.nomeFantasia, razaoSocial: client.dados.razaoSocial, cnpj: client.dados.cnpj };
  const myParcelamentos = parcelamentos.filter((p) => parcelamentoPertenceAoCliente(p, clienteRef));
  const myRecebimentos = recebimentos.filter((r) => recebimentoPertenceAoCliente(r, clienteRef));
  const myBoletos = boletosMensais.filter((b) => b.clienteId === client.id && b.status === "Emitido" && !b.removido);
  const myRecebimentosParceiro = recebimentosParceiro.filter((r) => r.clienteId === client.id && !r.removido);

  async function sincronizarDrive() {
    setSincronizandoDrive(true);
    setSincronizarErro(null);
    setSincronizarInfo(null);
    try {
      const nome = client!.dados.nomeFantasia || client!.dados.razaoSocial;
      const res = await fetch("/api/documentos/sincronizar-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId: client!.id, clienteNome: nome }),
      });
      const json = await res.json();
      if (!json.ok) {
        setSincronizarErro(json.error ?? "Não foi possível sincronizar com o Drive.");
      } else if (json.importados === 0 && Array.isArray(json.resumoPastas)) {
        const resumo = json.resumoPastas.map((p: { nome: string; totalArquivos: number }) => `${p.nome}: ${p.totalArquivos}`).join(" • ");
        setSincronizarInfo(`Nenhum documento novo. Arquivos encontrados por pasta — ${resumo}`);
      } else if (json.importados > 0) {
        setSincronizarInfo(`${json.importados} documento${json.importados === 1 ? "" : "s"} importado${json.importados === 1 ? "" : "s"} do Drive.`);
      }
    } catch {
      setSincronizarErro("Não foi possível sincronizar com o Drive.");
    } finally {
      setSincronizandoDrive(false);
    }
  }

  // Honorários lançados manualmente aqui + recebimentos batidos automaticamente
  // pelo CNPJ/CPF (ou nome) lá em Financeiro, boletos emitidos em Boletos e
  // recebimentos via PIX em Parceiros — assim que qualquer um deles é
  // marcado como pago, aparece aqui sem precisar cadastrar de novo. "atraso"
  // marca quando o pagamento caiu depois do vencimento.
  const honorarios = [
    ...client.historicoFinanceiro.map((h) => ({
      ...h,
      key: `manual-${h.id}`,
      origem: "manual" as const,
      historico: h,
      atraso: !!(h.pagamento && h.vencimento && h.pagamento > h.vencimento),
    })),
    ...myRecebimentos.map((r) => ({
      key: `financeiro-${r.id}`,
      competencia: r.competencia,
      servico: r.servico,
      valor: r.valor,
      vencimento: r.vencimento,
      pagamento: r.pagamento,
      status: r.status,
      origem: "financeiro" as const,
      historico: undefined,
      atraso: !!(r.pagamento && r.vencimento && r.pagamento > r.vencimento),
    })),
    ...myBoletos.map((b) => {
      const { valor, vencimento, pagamento, status, atraso } = resolveBoletoLedger(b, client);
      return {
        key: `boleto-${b.id}`,
        competencia: b.competencia,
        servico: "Boleto mensal",
        valor,
        vencimento,
        pagamento,
        status,
        origem: "boleto" as const,
        historico: undefined,
        atraso,
      };
    }),
    ...myRecebimentosParceiro.map((r) => ({
      key: `parceiro-${r.id}`,
      competencia: r.competencia,
      servico: "Recebimento parceiro (PIX)",
      valor: r.valor ?? client.financeiro.valorMensal,
      vencimento: "",
      pagamento: r.dataPagamento,
      status: r.status,
      origem: "parceiro" as const,
      historico: undefined,
      atraso: false,
    })),
  ].sort((a, b) => b.competencia.localeCompare(a.competencia));
  const onboardingPct = Math.round((client.onboarding.filter((o) => o.concluido).length / client.onboarding.length) * 100);

  const parceriaMeses = Math.max(
    0,
    Math.round((new Date().getTime() - new Date(client.criadoEm).getTime()) / (1000 * 60 * 60 * 24 * 30))
  );

  function addNote() {
    if (!noteText.trim()) return;
    // eslint-disable-next-line react-hooks/purity -- runs only from the button's onClick, never during render
    const id = `an-${Date.now()}`;
    addAnotacao({ id, clienteId: client!.id, autor: teamName(userId ?? ""), data: new Date().toISOString().slice(0, 10), texto: noteText });
    setNoteText("");
  }

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || client!.tags.includes(tag)) return;
    updateClientTags(client!.id, [...client!.tags, tag]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    updateClientTags(client!.id, client!.tags.filter((t) => t !== tag));
  }

  function handleDeleteClient() {
    const nome = client!.dados.nomeFantasia ?? client!.dados.razaoSocial;
    if (!confirm(`Excluir definitivamente o cliente "${nome}"? Isso apaga tarefas, documentos, certificados, licenças, checklist e demais dados vinculados a ele.`)) return;
    if (!confirm(`Confirma mesmo a exclusão de "${nome}"? Essa ação não pode ser desfeita.`)) return;
    deleteClient(client!.id);
    router.push("/clientes");
  }

  return (
    <div>
      <button onClick={() => router.push("/clientes")} className="mb-4 flex items-center gap-1.5 text-xs font-medium text-sand-500 hover:text-wine-700">
        <ArrowLeft className="size-3.5" /> Voltar para clientes
      </button>

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-semibold text-sand-900">{client.dados.nomeFantasia ?? client.dados.razaoSocial}</h1>
              <Select value={client.status} onValueChange={(v) => updateClientStatus(client.id, v as ClientStatus)}>
                <SelectTrigger className={cn(badgeVariants({ variant: toneFor(client.status) }), "h-auto w-auto gap-1 border-0 py-0.5")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
              {client.tags.map((t) => (
                <Badge key={t} variant="outline" className="gap-1 pr-1.5">
                  {t}
                  <button type="button" onClick={() => removeTag(t)} title={`Remover tag ${t}`} className="rounded-full p-0.5 hover:bg-sand-200">
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ))}
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                onBlur={addTag}
                placeholder="+ tag"
                className="h-6 w-20 rounded-full border-dashed px-2.5 text-[11px]"
              />
            </div>
            <p className="mt-1 text-sm text-sand-500">{client.dados.razaoSocial} • {client.dados.cnpj}</p>
          </div>
          <div className="flex flex-wrap items-start gap-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs sm:grid-cols-4">
              <MiniStat icon={Building2} label="Regime" value={client.dados.regimeTributario} />
              <MiniStat icon={User} label="Responsável" value={client.responsaveis.relacionamento ? teamName(client.responsaveis.relacionamento) : "—"} />
              <MiniStat icon={Wallet} label="Mensalidade" value={formatCurrency(client.financeiro.valorMensal)} />
              <MiniStat icon={ShieldCheck} label="Financeiro" value={client.financeiro.statusFinanceiro} />
            </div>
            <button
              type="button"
              onClick={handleDeleteClient}
              title="Excluir cliente"
              className="flex items-center gap-1.5 rounded-lg border border-status-danger/30 px-2.5 py-1.5 text-[11px] font-medium text-status-danger transition-colors hover:bg-status-danger-bg"
            >
              <Trash2 className="size-3.5" /> Excluir cliente
            </button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="geral">
        <TabsList>
          <TabsTrigger value="geral">Visão geral</TabsTrigger>
          <TabsTrigger value="cadastrais">Dados cadastrais</TabsTrigger>
          <TabsTrigger value="socios">Sócios &amp; contatos</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="contrato">Contrato</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="licencas">Licenças</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="pendencias">Pendências</TabsTrigger>
          <TabsTrigger value="indicacoes">Indicações</TabsTrigger>
          <TabsTrigger value="atendimento">Atendimento</TabsTrigger>
          <TabsTrigger value="anotacoes">Anotações</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Tarefas recentes</CardTitle></CardHeader>
            <CardContent className="space-y-2 pt-4">
              {myTasks.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2 text-xs">
                  <span className="truncate text-sand-800">{t.titulo}</span>
                  <StatusBadge status={t.status} />
                </div>
              ))}
              {myTasks.length === 0 && <p className="text-xs text-sand-400">Sem tarefas recentes.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Obrigações recentes</CardTitle></CardHeader>
            <CardContent className="space-y-2 pt-4">
              {myObligations.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2 text-xs">
                  <span className="truncate text-sand-800">{o.tipo} — {o.competencia}</span>
                  <StatusBadge status={o.status} />
                </div>
              ))}
              {myObligations.length === 0 && <p className="text-xs text-sand-400">Sem obrigações recentes.</p>}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Certificados digitais</CardTitle></CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-2">
                {myCerts.map((c) => (
                  <Badge key={c.id} variant="outline" className="gap-1.5 py-1">
                    {c.tipo} · válido até {formatDate(c.dataVencimento)} <StatusBadge status={c.status} />
                  </Badge>
                ))}
                {myCerts.length === 0 && <p className="text-xs text-sand-400">Nenhum certificado cadastrado.</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><Award className="size-4 text-wine-600" /> Licenças</CardTitle></CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-2">
                {myLicencas.map((l) => (
                  <Badge key={l.id} variant="outline" className="gap-1.5 py-1">
                    {l.nome} · válida até {formatDate(l.dataVencimento)} <StatusBadge status={l.status} />
                  </Badge>
                ))}
                {myLicencas.length === 0 && <p className="text-xs text-sand-400">Nenhuma licença cadastrada.</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="size-4 text-wine-600" /> Parcelamentos</CardTitle></CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-2">
                {myParcelamentos.map((p) => (
                  <Badge key={p.id} variant="outline" className="gap-1.5 py-1">
                    {p.nome} <StatusBadge status={isParcelamentoAtivo(p) ? "Ativo" : "Finalizado"} />
                  </Badge>
                ))}
                {myParcelamentos.length === 0 && <p className="text-xs text-sand-400">Nenhum parcelamento cadastrado.</p>}
              </div>
            </CardContent>
          </Card>

          <DepartmentNotesCard client={client} depto="fiscal" />
          <DepartmentNotesCard client={client} depto="contabil" />
          <DepartmentNotesCard client={client} depto="pessoal" />

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Handshake className="size-4 text-wine-600" /> Histórico de parceria</CardTitle></CardHeader>
            <CardContent className="space-y-2 pt-4 text-xs">
              <div className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2">
                <span className="text-sand-500">Cliente desde</span>
                <span className="font-medium text-sand-800">{formatDate(client.criadoEm)} · {parceriaMeses} {parceriaMeses === 1 ? "mês" : "meses"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2">
                <span className="text-sand-500">Início do contrato</span>
                <span className="font-medium text-sand-800">{formatDate(client.financeiro.inicioContrato)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2">
                <span className="text-sand-500">Onboarding</span>
                <span className="font-medium text-sand-800">{onboardingPct}% concluído</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2">
                <span className="text-sand-500">Indicações geradas</span>
                <span className="font-medium text-sand-800">{myIndicacoes.length}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cadastrais">
          <CadastroForm client={client} />
        </TabsContent>

        <TabsContent value="socios" className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Sócios</CardTitle>
              <Button size="sm" onClick={openNovoSocio}><Plus className="size-3.5" /> Novo sócio</Button>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {client.socios.map((s) => {
                const revealed = revealedSenhas.has(s.id);
                return (
                  <div key={s.id} className="rounded-lg border border-sand-200 p-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sand-900">
                        {s.nome}{" "}
                        {s.administrador && <Badge variant="cream" className="ml-1">Administrador</Badge>}
                        {s.representanteLegal && <Badge variant="outline" className="ml-1">Representante legal</Badge>}
                      </p>
                      <div className="flex shrink-0 items-center gap-1">
                        <button type="button" onClick={() => openEditSocio(s)} title="Editar" className="flex size-6 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-sand-700">
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => confirm(`Excluir o sócio "${s.nome}"?`) && deleteSocio(client.id, s.id)}
                          title="Excluir"
                          className="flex size-6 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-sand-500">CPF {s.cpf} • {s.percentual}% • desde {formatDate(s.dataEntrada)}</p>
                    {(s.telefone || s.email) && <p className="mt-0.5 text-sand-500">{s.telefone ?? "—"} • {s.email ?? "—"}</p>}
                    {s.senhaGovBr && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-[11px] text-sand-400">Senha gov.br</span>
                        <span className="font-mono text-xs text-sand-600">{revealed ? s.senhaGovBr : "••••••"}</span>
                        <button
                          type="button"
                          onClick={() => toggleSenha(s.id)}
                          title={revealed ? "Ocultar a senha" : "Exibir a senha"}
                          className="text-sand-400 hover:text-sand-600"
                        >
                          {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {client.socios.length === 0 && <p className="text-xs text-sand-400">Nenhum sócio cadastrado.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Contatos</CardTitle>
              <Button size="sm" onClick={openNovoContato}><Plus className="size-3.5" /> Novo contato</Button>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {client.contatos.map((c) => (
                <div key={c.id} className="rounded-lg border border-sand-200 p-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sand-900">{c.nome} <Badge variant="outline" className="ml-1">{c.papel}</Badge></p>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => openEditContato(c)} title="Editar" className="flex size-6 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-sand-700">
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => confirm(`Excluir o contato "${c.nome}"?`) && deleteContato(client.id, c.id)}
                        title="Excluir"
                        className="flex size-6 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-sand-500">{c.telefone ?? "—"} • {c.email ?? "—"}</p>
                </div>
              ))}
              {client.contatos.length === 0 && <p className="text-xs text-sand-400">Nenhum contato cadastrado.</p>}
            </CardContent>
          </Card>
          <SocioFormDialog
            key={`socio-${editingSocio?.id ?? "new"}-${socioSession}`}
            open={socioOpen}
            onOpenChange={setSocioOpen}
            clienteId={client.id}
            socio={editingSocio}
          />
          <ContatoFormDialog
            key={`contato-${editingContato?.id ?? "new"}-${contatoSession}`}
            open={contatoOpen}
            onOpenChange={setContatoOpen}
            clienteId={client.id}
            contato={editingContato}
          />
        </TabsContent>

        <TabsContent value="onboarding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardCheck className="size-4 text-wine-600" /> Checklist de onboarding</CardTitle>
              <span className="text-xs font-semibold text-wine-700">{onboardingPct}% concluído</span>
            </CardHeader>
            <CardContent className="pt-4">
              <Progress value={onboardingPct} className="mb-4" />
              <div className="grid gap-1.5 sm:grid-cols-2">
                {client.onboarding.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-sand-50">
                    <Checkbox checked={item.concluido} onCheckedChange={() => toggleOnboardingItem(client.id, item.id)} />
                    <span className={item.concluido ? "text-sand-400 line-through" : "text-sand-800"}>{item.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contrato">
          <ContratoAssinaturaCard client={client} />
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-4">
          <FinanceiroClienteForm client={client} />
          <Card>
            <CardHeader>
              <CardTitle>Histórico de honorários</CardTitle>
              <Button size="sm" onClick={openNovoLancamento}><Plus className="size-3.5" /> Novo lançamento</Button>
            </CardHeader>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competência</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {honorarios.map((h) => (
                    <TableRow key={h.key}>
                      <TableCell className="font-medium">{h.competencia}</TableCell>
                      <TableCell className="text-sand-500">{h.servico ?? "—"}</TableCell>
                      <TableCell>{formatCurrency(h.valor)}</TableCell>
                      <TableCell>{h.vencimento ? formatDate(h.vencimento) : "—"}</TableCell>
                      <TableCell>
                        {h.pagamento ? (
                          <div className="flex items-center gap-1.5">
                            {formatDate(h.pagamento)}
                            {h.atraso && (
                              <span
                                title="Pago com atraso (depois do vencimento)"
                                className="rounded-full bg-status-danger-bg px-1.5 py-0.5 text-[10px] font-semibold uppercase text-status-danger"
                              >
                                Atraso
                              </span>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell><StatusBadge status={h.status} /></TableCell>
                      <TableCell>
                        {h.origem === "manual" ? (
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => openEditLancamento(h.historico!)} title="Editar" className="flex size-6 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-sand-700">
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => confirm("Excluir este lançamento?") && deleteHistoricoCliente(client.id, h.historico!.id)}
                              title="Excluir"
                              className="flex size-6 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        ) : h.origem === "boleto" ? (
                          <Badge variant="outline" title="Vindo da emissão cadastrada em Boletos">Boleto</Badge>
                        ) : h.origem === "parceiro" ? (
                          <Badge variant="outline" title="Vindo do recebimento cadastrado em Parceiros">Parceiro</Badge>
                        ) : (
                          <Badge variant="outline" title="Vindo do recebimento cadastrado em Financeiro">Financeiro</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {honorarios.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="py-8 text-center text-sand-400">Sem histórico financeiro.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <HistoricoFinanceiroFormDialog
            key={`historico-${editingHistorico?.id ?? "new"}-${historicoSession}`}
            open={historicoOpen}
            onOpenChange={setHistoricoOpen}
            clienteId={client.id}
            entry={editingHistorico}
          />
        </TabsContent>

        <TabsContent value="licencas">
          <Card>
            <CardContent className="p-5">
              <div className="mb-3 flex justify-end">
                <Button size="sm" onClick={() => setLicencaOpen(true)}>
                  <Plus className="size-3.5" /> Nova licença
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myLicencas.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="flex items-center gap-2 font-medium text-sand-800">
                        <Award className="size-3.5 shrink-0 text-wine-500" /> {l.nome}
                      </TableCell>
                      <TableCell>{l.dataEmissao ? formatDate(l.dataEmissao) : "—"}</TableCell>
                      <TableCell>{formatDate(l.dataVencimento)}</TableCell>
                      <TableCell><StatusBadge status={l.status} /></TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => confirm(`Excluir "${l.nome}"?`) && deleteLicenca(l.id)}
                          title="Excluir"
                          className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {myLicencas.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="py-8 text-center text-sand-400">Nenhuma licença ou registro cadastrado.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <LicencaFormDialog open={licencaOpen} onOpenChange={setLicencaOpen} clienteId={client.id} />
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          <TiposDocumentoRecorrenteCard clienteId={client.id} />
          <Card>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                {client.dados.linkDrive ? (
                  <a
                    href={client.dados.linkDrive}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-wine-700 hover:underline"
                  >
                    <FolderOpen className="size-3.5" /> Abrir pasta no Drive
                  </a>
                ) : (
                  <p className="text-[11px] text-sand-400">
                    Nenhuma pasta do Drive vinculada — adicione o link em Dados cadastrais.
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={sincronizarDrive} disabled={sincronizandoDrive}>
                    <RefreshCw className={cn("size-3.5", sincronizandoDrive && "animate-spin")} />
                    {sincronizandoDrive ? "Sincronizando..." : "Sincronizar com Drive"}
                  </Button>
                  <Button size="sm" onClick={() => setDocUploadOpen(true)}>
                    <Upload className="size-3.5" /> Anexar documento
                  </Button>
                </div>
              </div>
              {sincronizarErro && <p className="mb-3 text-[11px] text-status-danger">{sincronizarErro}</p>}
              {sincronizarInfo && <p className="mb-3 text-[11px] text-sand-400">{sincronizarInfo}</p>}
              <div className="space-y-2">
                {myDocs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2.5 text-xs">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-sand-800">{d.nome}</span>
                      <span className="text-sand-400">{d.categoria} • {d.tamanho}</span>
                    </span>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sand-400">{formatDate(d.dataArquivo)}</span>
                      <DocumentActions documento={d} />
                    </div>
                  </div>
                ))}
                {myDocs.length === 0 && <p className="text-xs text-sand-400">Nenhum documento anexado.</p>}
              </div>
            </CardContent>
          </Card>
          <DocumentUploadDialog open={docUploadOpen} onOpenChange={setDocUploadOpen} fixedClienteId={client.id} />
        </TabsContent>

        <TabsContent value="pendencias">
          <PendenciasTab clienteId={client.id} />
        </TabsContent>

        <TabsContent value="indicacoes">
          <Card>
            <CardContent className="p-5">
              <div className="mb-3 flex justify-end">
                <Button size="sm" onClick={() => setIndicacaoOpen(true)}>
                  <Plus className="size-3.5" /> Nova indicação
                </Button>
              </div>
              <div className="space-y-2">
                {myIndicacoes.map((i) => (
                  <div key={i.id} className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2.5 text-xs">
                    <span className="flex min-w-0 items-center gap-2">
                      <Share2 className="size-3.5 shrink-0 text-wine-500" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-sand-800">{i.nomeIndicado}{i.empresa ? ` · ${i.empresa}` : ""}</span>
                        <span className="text-sand-400">{i.contato ?? "Sem contato informado"} • {formatDate(i.data)}</span>
                      </span>
                    </span>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={i.status} />
                      <button
                        type="button"
                        onClick={() => confirm(`Excluir indicação de "${i.nomeIndicado}"?`) && deleteIndicacao(i.id)}
                        title="Excluir"
                        className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {myIndicacoes.length === 0 && <p className="text-xs text-sand-400">Nenhuma indicação registrada por este cliente ainda.</p>}
              </div>
            </CardContent>
          </Card>
          <IndicacaoFormDialog open={indicacaoOpen} onOpenChange={setIndicacaoOpen} clienteId={client.id} />
        </TabsContent>

        <TabsContent value="atendimento">
          <Card>
            <CardContent className="space-y-3 p-5">
              {myTimeline.map((t) => (
                <div key={t.id} className="flex gap-3 text-xs">
                  <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-wine-500" />
                  <div>
                    <p className="text-sand-800">{t.descricao}</p>
                    <p className="text-[11px] text-sand-400">{formatDateTime(t.data)} • {t.autor}</p>
                  </div>
                </div>
              ))}
              {myTimeline.length === 0 && <p className="text-xs text-sand-400">Sem atendimentos registrados.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anotacoes" className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-5">
              <Textarea placeholder="Escreva uma anotação interna (não visível ao cliente)…" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <Button size="sm" onClick={addNote}>Adicionar anotação</Button>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {myNotes.map((n) => (
              <Card key={n.id}>
                <CardContent className="p-4 text-xs">
                  {n.marcador && <Badge variant="cream" className="mb-1.5">{MARKERS[n.marcador]}</Badge>}
                  <p className="text-sand-800">{n.texto}</p>
                  <p className="mt-1.5 text-[11px] text-sand-400">{n.autor} • {formatDate(n.data)}</p>
                </CardContent>
              </Card>
            ))}
            {myNotes.length === 0 && <p className="text-xs text-sand-400">Nenhuma anotação ainda.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3.5 text-wine-500" />
      <span>
        <span className="block text-[10px] text-sand-400">{label}</span>
        <span className="block font-medium text-sand-800">{value}</span>
      </span>
    </div>
  );
}
