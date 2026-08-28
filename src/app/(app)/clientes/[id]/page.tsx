"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, ShieldCheck, Wallet, User, ClipboardCheck, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CadastroForm } from "@/components/clients/cadastro-form";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { DocumentActions } from "@/components/documents/document-actions";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { teamName } from "@/lib/data/seed";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

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
  const toggleOnboardingItem = useAppStore((s) => s.toggleOnboardingItem);
  const addAnotacao = useAppStore((s) => s.addAnotacao);
  const { userId } = useAuthStore();
  const [noteText, setNoteText] = useState("");
  const [docUploadOpen, setDocUploadOpen] = useState(false);

  const client = clients.find((c) => c.id === id);
  if (!client) {
    return (
      <div className="py-20 text-center text-sand-400">
        Cliente não encontrado. <Link href="/clientes" className="text-wine-700 hover:underline">Voltar</Link>
      </div>
    );
  }

  const myTasks = tasks.filter((t) => t.clienteId === client.id);
  const myObligations = obligations.filter((o) => o.clienteId === client.id);
  const myDocs = documentos.filter((d) => d.clienteId === client.id);
  const myCerts = certificados.filter((c) => c.clienteId === client.id);
  const myTimeline = timeline.filter((t) => t.clienteId === client.id);
  const myNotes = anotacoes.filter((n) => n.clienteId === client.id);
  const onboardingPct = Math.round((client.onboarding.filter((o) => o.concluido).length / client.onboarding.length) * 100);

  function addNote() {
    if (!noteText.trim()) return;
    // eslint-disable-next-line react-hooks/purity -- runs only from the button's onClick, never during render
    const id = `an-${Date.now()}`;
    addAnotacao({ id, clienteId: client!.id, autor: teamName(userId ?? ""), data: new Date().toISOString().slice(0, 10), texto: noteText });
    setNoteText("");
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
              <StatusBadge status={client.status} />
              {client.tags.map((t) => (
                <Badge key={t} variant="outline">{t}</Badge>
              ))}
            </div>
            <p className="mt-1 text-sm text-sand-500">{client.dados.razaoSocial} • {client.dados.cnpj}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs sm:grid-cols-4">
            <MiniStat icon={Building2} label="Regime" value={client.dados.regimeTributario} />
            <MiniStat icon={User} label="Responsável" value={client.responsaveis.relacionamento ? teamName(client.responsaveis.relacionamento) : "—"} />
            <MiniStat icon={Wallet} label="Mensalidade" value={formatCurrency(client.financeiro.valorMensal)} />
            <MiniStat icon={ShieldCheck} label="Financeiro" value={client.financeiro.statusFinanceiro} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="geral">
        <TabsList>
          <TabsTrigger value="geral">Visão geral</TabsTrigger>
          <TabsTrigger value="cadastrais">Dados cadastrais</TabsTrigger>
          <TabsTrigger value="socios">Sócios &amp; contatos</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="atendimento">Atendimento</TabsTrigger>
          <TabsTrigger value="anotacoes">Anotações</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Responsáveis internos</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 pt-4 text-xs">
              {(["comercial", "relacionamento", "fiscal", "contabil", "pessoal", "societario", "financeiro"] as const).map((k) => (
                <div key={k}>
                  <p className="text-[10px] uppercase tracking-wide text-sand-400">{k}</p>
                  <p className="font-medium text-sand-800">{client.responsaveis[k] ? teamName(client.responsaveis[k]!) : "—"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Tarefas &amp; obrigações recentes</CardTitle></CardHeader>
            <CardContent className="space-y-2 pt-4">
              {myTasks.slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2 text-xs">
                  <span className="truncate text-sand-800">{t.titulo}</span>
                  <StatusBadge status={t.status} />
                </div>
              ))}
              {myObligations.slice(0, 2).map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2 text-xs">
                  <span className="truncate text-sand-800">{o.tipo} — {o.competencia}</span>
                  <StatusBadge status={o.status} />
                </div>
              ))}
              {myTasks.length === 0 && myObligations.length === 0 && <p className="text-xs text-sand-400">Sem pendências recentes.</p>}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Certificados digitais</CardTitle></CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-2">
                {myCerts.map((c) => (
                  <Badge key={c.id} variant="outline" className="gap-1.5 py-1">
                    {c.tipo} <StatusBadge status={c.status} />
                  </Badge>
                ))}
                {myCerts.length === 0 && <p className="text-xs text-sand-400">Nenhum certificado cadastrado.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cadastrais">
          <CadastroForm client={client} />
        </TabsContent>

        <TabsContent value="socios" className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Sócios</CardTitle></CardHeader>
            <CardContent className="space-y-2 pt-4">
              {client.socios.map((s) => (
                <div key={s.id} className="rounded-lg border border-sand-200 p-3 text-xs">
                  <p className="font-semibold text-sand-900">{s.nome} {s.administrador && <Badge variant="cream" className="ml-1">Administrador</Badge>}</p>
                  <p className="mt-1 text-sand-500">CPF {s.cpf} • {s.percentual}% • desde {formatDate(s.dataEntrada)}</p>
                </div>
              ))}
              {client.socios.length === 0 && <p className="text-xs text-sand-400">Nenhum sócio cadastrado.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Contatos</CardTitle></CardHeader>
            <CardContent className="space-y-2 pt-4">
              {client.contatos.map((c) => (
                <div key={c.id} className="rounded-lg border border-sand-200 p-3 text-xs">
                  <p className="font-semibold text-sand-900">{c.nome} <Badge variant="outline" className="ml-1">{c.papel}</Badge></p>
                  <p className="mt-1 text-sand-500">{c.telefone ?? "—"} • {c.email ?? "—"}</p>
                </div>
              ))}
              {client.contatos.length === 0 && <p className="text-xs text-sand-400">Nenhum contato cadastrado.</p>}
            </CardContent>
          </Card>
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

        <TabsContent value="financeiro" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniCard label="Valor mensal" value={formatCurrency(client.financeiro.valorMensal)} />
            <MiniCard label="Vencimento" value={`Dia ${client.financeiro.vencimentoDia}`} />
            <MiniCard label="Forma de pagamento" value={client.financeiro.formaPagamento} />
            <MiniCard label="Início do contrato" value={formatDate(client.financeiro.inicioContrato)} />
          </div>
          <Card>
            <CardHeader><CardTitle>Histórico de honorários</CardTitle></CardHeader>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Competência</TableHead><TableHead>Valor</TableHead><TableHead>Vencimento</TableHead><TableHead>Pagamento</TableHead><TableHead>Status</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {client.historicoFinanceiro.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.competencia}</TableCell>
                      <TableCell>{formatCurrency(h.valor)}</TableCell>
                      <TableCell>{formatDate(h.vencimento)}</TableCell>
                      <TableCell>{h.pagamento ? formatDate(h.pagamento) : "—"}</TableCell>
                      <TableCell><StatusBadge status={h.status} /></TableCell>
                    </TableRow>
                  ))}
                  {client.historicoFinanceiro.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="py-8 text-center text-sand-400">Sem histórico financeiro.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardContent className="p-5">
              <div className="mb-3 flex justify-end">
                <Button size="sm" onClick={() => setDocUploadOpen(true)}>
                  <Upload className="size-3.5" /> Anexar documento
                </Button>
              </div>
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

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[11px] text-sand-500">{label}</p>
        <p className="mt-1 text-sm font-semibold text-sand-900">{value}</p>
      </CardContent>
    </Card>
  );
}
