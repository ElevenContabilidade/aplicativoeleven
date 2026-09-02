"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LogOut, FileText, Receipt, ShieldCheck, ClipboardList } from "lucide-react";
import { EleveLogo } from "@/components/brand/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthStore } from "@/lib/store/auth-store";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/team-lookup";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ClientPortalPage() {
  const router = useRouter();
  const { isAuthenticated, kind, userId, logout, hasHydrated } = useAuthStore();
  const clients = useAppStore((s) => s.clients);
  const obligations = useAppStore((s) => s.obligations);
  const documentos = useAppStore((s) => s.documentos);
  const certificados = useAppStore((s) => s.certificados);

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || kind !== "cliente")) router.replace("/login");
  }, [isAuthenticated, kind, hasHydrated, router]);

  const client = useMemo(() => clients.find((c) => c.id === userId), [clients, userId]);

  if (!hasHydrated || !client) return null;

  const myObligations = obligations.filter((o) => o.clienteId === client.id);
  const myDocs = documentos.filter((d) => d.clienteId === client.id);
  const myCerts = certificados.filter((c) => c.clienteId === client.id);

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
          <h1 className="font-display text-2xl font-semibold text-sand-900">
            {client.dados.nomeFantasia ?? client.dados.razaoSocial}
          </h1>
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

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="size-4 text-wine-600" /> Documentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {myDocs.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2 text-xs">
                  <span className="truncate text-sand-800">{d.nome}</span>
                  <span className="shrink-0 text-sand-400">{formatDate(d.dataArquivo)}</span>
                </div>
              ))}
              {myDocs.length === 0 && <p className="text-xs text-sand-400">Nenhum documento disponível.</p>}
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
                {client.historicoFinanceiro.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.competencia}</TableCell>
                    <TableCell>{formatCurrency(h.valor)}</TableCell>
                    <TableCell>{formatDate(h.vencimento)}</TableCell>
                    <TableCell><StatusBadge status={h.status} /></TableCell>
                  </TableRow>
                ))}
                {client.historicoFinanceiro.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="py-6 text-center text-sand-400">Sem histórico financeiro.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
