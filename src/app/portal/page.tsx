"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, FileText, Receipt, ShieldCheck, ClipboardList, BadgeCheck, AlertTriangle, Eye, FileBadge } from "lucide-react";
import { EleveLogo } from "@/components/brand/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthStore } from "@/lib/store/auth-store";
import { useAppStore } from "@/lib/store/app-store";
import { useSupabaseDocumentosSync } from "@/lib/supabase/use-documentos-sync";
import { useSupabasePendenciasSync } from "@/lib/supabase/use-pendencias-sync";
import { useSupabaseChecklistMensalSync } from "@/lib/supabase/use-checklist-mensal-sync";
import { useSupabaseFinanceiroSync } from "@/lib/supabase/use-financeiro-sync";
import { DocumentUploadCard } from "@/components/portal/document-upload-card";
import { PendenciasCard } from "@/components/portal/pendencias-card";
import { ChecklistMensalCard } from "@/components/portal/checklist-mensal-card";
import { SolicitacaoCard } from "@/components/portal/solicitacao-card";
import { FaturamentoDashboardCard } from "@/components/portal/faturamento-dashboard-card";
import { teamName } from "@/lib/team-lookup";
import { resolveBoletoLedger } from "@/lib/boleto";
import type { DocumentoCategoria } from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const JANELA_ALERTA_DIAS = 30;

function diasAte(dataIso: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${dataIso}T00:00:00`).getTime() - hoje.getTime()) / 86_400_000);
}

export default function ClientPortalPage() {
  const router = useRouter();
  const { isAuthenticated, kind, userId, logout, hasHydrated } = useAuthStore();
  const clients = useAppStore((s) => s.clients);
  const obligations = useAppStore((s) => s.obligations);
  const documentos = useAppStore((s) => s.documentos);
  const certificados = useAppStore((s) => s.certificados);
  const pendencias = useAppStore((s) => s.pendencias);
  const boletosMensais = useAppStore((s) => s.boletosMensais);
  const notasFiscaisMensais = useAppStore((s) => s.notasFiscaisMensais);
  const licencas = useAppStore((s) => s.licencas);
  const faturamentoMensal = useAppStore((s) => s.faturamentoMensal);
  const [filtroCategoria, setFiltroCategoria] = useState<DocumentoCategoria | "Todos">("Todos");

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || kind !== "cliente")) router.replace("/login");
  }, [isAuthenticated, kind, hasHydrated, router]);

  useSupabaseDocumentosSync(hasHydrated && isAuthenticated && kind === "cliente");
  useSupabasePendenciasSync(hasHydrated && isAuthenticated && kind === "cliente");
  useSupabaseChecklistMensalSync(hasHydrated && isAuthenticated && kind === "cliente");
  useSupabaseFinanceiroSync(hasHydrated && isAuthenticated && kind === "cliente");

  const client = useMemo(() => clients.find((c) => c.id === userId), [clients, userId]);

  if (!hasHydrated || !client) return null;

  const myObligations = obligations.filter((o) => o.clienteId === client.id);
  const myDocs = documentos.filter((d) => d.clienteId === client.id);
  const myCerts = certificados.filter((c) => c.clienteId === client.id);
  const myPendencias = pendencias.filter((p) => p.clienteId === client.id);
  const myBoletos = boletosMensais.filter((b) => b.clienteId === client.id && b.status === "Emitido" && !b.removido);
  const myNotasFiscais = notasFiscaisMensais
    .filter((n) => n.clienteId === client.id && !n.removido)
    .sort((a, b) => b.competencia.localeCompare(a.competencia));
  const myLicencas = licencas.filter((l) => l.clienteId === client.id);
  const myFaturamento = faturamentoMensal.filter((f) => f.clienteId === client.id);
  const clienteNome = client.dados.nomeFantasia ?? client.dados.razaoSocial;

  // Honorários lançados manualmente + boletos emitidos em Boletos — assim que
  // qualquer um deles é marcado como pago, aparece aqui automaticamente,
  // igual ao Financeiro interno e ao Cliente 360.
  const honorarios = [
    ...client.historicoFinanceiro.map((h) => ({
      key: `manual-${h.id}`,
      competencia: h.competencia,
      valor: h.valor,
      vencimento: h.vencimento,
      status: h.status,
    })),
    ...myBoletos.map((b) => {
      const { valor, vencimento, status } = resolveBoletoLedger(b, client);
      return { key: `boleto-${b.id}`, competencia: b.competencia, valor, vencimento, status };
    }),
  ].sort((a, b) => b.competencia.localeCompare(a.competencia));

  const alertas = [
    ...myLicencas
      .map((l) => {
        const dias = diasAte(l.dataVencimento);
        if (dias > JANELA_ALERTA_DIAS) return null;
        return {
          id: `lic-${l.id}`,
          titulo: dias < 0 ? "Licença vencida" : dias === 0 ? "Licença vence hoje" : `Licença vencendo em ${dias} dia${dias === 1 ? "" : "s"}`,
          descricao: l.nome,
          grave: dias < 0,
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null),
    ...myCerts
      .map((c) => {
        const dias = diasAte(c.dataVencimento);
        if (dias > JANELA_ALERTA_DIAS) return null;
        return {
          id: `cert-${c.id}`,
          titulo:
            dias < 0 ? "Certificado vencido" : dias === 0 ? "Certificado vence hoje" : `Certificado vencendo em ${dias} dia${dias === 1 ? "" : "s"}`,
          descricao: c.tipo,
          grave: dias < 0,
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null),
    ...myObligations
      .filter((o) => o.status === "Em atraso")
      .map((o) => ({ id: `obl-${o.id}`, titulo: "Obrigação em atraso", descricao: `${o.tipo} — competência ${o.competencia}`, grave: true })),
  ].sort((a, b) => (b.grave ? 1 : 0) - (a.grave ? 1 : 0));

  const categoriasComDocs = [...new Set(myDocs.map((d) => d.categoria))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const docsFiltrados = filtroCategoria === "Todos" ? myDocs : myDocs.filter((d) => d.categoria === filtroCategoria);

  return (
    <div className="min-h-screen bg-sand-50">
      <header className="border-b border-sand-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <EleveLogo markClassName="h-7 w-7" showTagline />
          <Button variant="ghost" size="sm" onClick={() => { logout(); router.push("/login"); }}>
            <LogOut className="size-3.5" /> Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-5 py-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-wine-600">Portal do cliente</p>
          <h1 className="font-display text-2xl font-semibold text-sand-900">{clienteNome}</h1>
          <p className="text-xs text-sand-500">{client.dados.cnpj}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] text-sand-500">Situação</p>
              <div className="mt-1.5"><StatusBadge status={client.status} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] text-sand-500">Regime tributário</p>
              <p className="mt-1 text-sm font-semibold text-sand-900">{client.dados.regimeTributario}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] text-sand-500">Mensalidade</p>
              <p className="mt-1 text-sm font-semibold text-sand-900">{formatCurrency(client.financeiro.valorMensal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] text-sand-500">Responsável</p>
              <p className="mt-1 text-sm font-semibold text-sand-900">{teamName(client.responsaveis.relacionamento ?? "")}</p>
            </CardContent>
          </Card>
        </div>

        <FaturamentoDashboardCard faturamento={myFaturamento} />

        {alertas.length > 0 && (
          <Card className="border-status-danger/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="size-4 text-status-danger" /> Avisos importantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {alertas.map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-xs",
                    a.grave ? "border-status-danger/30 bg-status-danger/5" : "border-status-warning/30 bg-status-warning/5"
                  )}
                >
                  <div className="min-w-0">
                    <p className={cn("truncate font-medium", a.grave ? "text-status-danger" : "text-status-warning")}>{a.titulo}</p>
                    <p className="text-sand-500">{a.descricao}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <PendenciasCard pendencias={myPendencias} />

        <ChecklistMensalCard clienteId={client.id} clienteNome={clienteNome} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardList className="size-4 text-wine-600" /> Obrigações</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Tipo</TableHead><TableHead>Competência</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {myObligations.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.tipo}</TableCell>
                    <TableCell>{o.competencia}</TableCell>
                    <TableCell>{formatDate(o.vencimento)}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                  </TableRow>
                ))}
                {myObligations.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="py-6 text-center text-sand-400">Nenhuma obrigação no momento.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {myLicencas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BadgeCheck className="size-4 text-wine-600" /> Licenças e vencimentos</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Licença</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {myLicencas.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.nome}</TableCell>
                      <TableCell>{formatDate(l.dataVencimento)}</TableCell>
                      <TableCell><StatusBadge status={l.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <DocumentUploadCard clienteId={client.id} clienteNome={clienteNome} />

        <SolicitacaoCard clienteId={client.id} />

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex-col items-start">
              <CardTitle className="flex items-center gap-2"><FileText className="size-4 text-wine-600" /> Documentos</CardTitle>
              {categoriasComDocs.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFiltroCategoria("Todos")}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      filtroCategoria === "Todos" ? "border-wine-600 bg-wine-700 text-cream-50" : "border-sand-300 bg-white text-sand-600 hover:bg-sand-100"
                    )}
                  >
                    Todos
                  </button>
                  {categoriasComDocs.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFiltroCategoria(c)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                        filtroCategoria === c ? "border-wine-600 bg-wine-700 text-cream-50" : "border-sand-300 bg-white text-sand-600 hover:bg-sand-100"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {docsFiltrados.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-sand-200 px-3 py-2 text-xs">
                  <span className="min-w-0">
                    <span className="block truncate text-sand-800">{d.nome}</span>
                    <span className="text-sand-400">{d.categoria}</span>
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sand-400">{formatDate(d.dataArquivo)}</span>
                    {d.url ? (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Visualizar / baixar"
                        className="flex size-6 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-wine-700"
                      >
                        <Eye className="size-3.5" />
                      </a>
                    ) : (
                      <span title="Arquivo indisponível" className="flex size-6 items-center justify-center text-sand-200">
                        <Eye className="size-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {docsFiltrados.length === 0 && <p className="text-xs text-sand-400">Nenhum documento disponível.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4 text-wine-600" /> Certificados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {myCerts.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2 text-xs">
                  <span className="text-sand-800">{c.tipo}</span>
                  <StatusBadge status={c.status} />
                </div>
              ))}
              {myCerts.length === 0 && <p className="text-xs text-sand-400">Nenhum certificado cadastrado.</p>}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Receipt className="size-4 text-wine-600" /> Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Competência</TableHead><TableHead>Valor</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {honorarios.map((h) => (
                  <TableRow key={h.key}>
                    <TableCell className="font-medium">{h.competencia}</TableCell>
                    <TableCell>{formatCurrency(h.valor)}</TableCell>
                    <TableCell>{formatDate(h.vencimento)}</TableCell>
                    <TableCell><StatusBadge status={h.status} /></TableCell>
                  </TableRow>
                ))}
                {honorarios.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="py-6 text-center text-sand-400">Sem histórico financeiro.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {myNotasFiscais.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileBadge className="size-4 text-wine-600" /> Notas fiscais emitidas</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Competência</TableHead><TableHead>Nº da nota</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {myNotasFiscais.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium">{n.competencia}</TableCell>
                      <TableCell>{n.numeroNota ?? "—"}</TableCell>
                      <TableCell>{n.valor ? formatCurrency(n.valor) : formatCurrency(client.financeiro.valorMensal)}</TableCell>
                      <TableCell><StatusBadge status={n.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
