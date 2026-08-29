"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetricCard } from "@/components/dashboard/metric-card";
import type { LucideIcon } from "lucide-react";
import { AlertOctagon, ListTodo, Users2 } from "lucide-react";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/data/seed";
import type { Client, Departamento, DocumentoCategoria } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function DepartmentPanel({
  title,
  description,
  responsavelKey,
  departamento,
  docCategorias,
  icon: Icon,
}: {
  title: string;
  description: string;
  responsavelKey: keyof Client["responsaveis"];
  departamento: Departamento;
  docCategorias?: DocumentoCategoria[];
  icon: LucideIcon;
}) {
  const clients = useAppStore((s) => s.clients);
  const tasks = useAppStore((s) => s.tasks);
  const documentos = useAppStore((s) => s.documentos);

  const myClients = clients.filter((c) => c.responsaveis[responsavelKey] && (c.status === "Ativo" || c.status === "Com pendência" || c.status === "Onboarding"));
  const myTasks = tasks.filter((t) => t.departamento === departamento);
  const openTasks = myTasks.filter((t) => !["Concluída", "Cancelada"].includes(t.status));
  const overdueTasks = openTasks.filter((t) => new Date(t.prazo) < new Date(new Date().toDateString()));
  const myDocs = docCategorias ? documentos.filter((d) => docCategorias.includes(d.categoria)) : [];

  return (
    <div>
      <PageHeader title={title} description={description} />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricCard label="Clientes do setor" value={myClients.length} icon={Users2} tone="wine" />
        <MetricCard label="Tarefas abertas" value={openTasks.length} icon={ListTodo} />
        <MetricCard label="Tarefas em atraso" value={overdueTasks.length} icon={AlertOctagon} tone="danger" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Icon className="size-4 text-wine-600" /> Clientes do setor</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-4">
            {myClients.map((c) => (
              <Link key={c.id} href={`/clientes/${c.id}`} className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2 text-xs hover:bg-sand-50">
                <span className="truncate text-sand-800">{c.dados.nomeFantasia ?? c.dados.razaoSocial}</span>
                <StatusBadge status={c.status} />
              </Link>
            ))}
            {myClients.length === 0 && <p className="text-xs text-sand-400">Nenhum cliente atribuído a este setor.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tarefas do setor</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-4">
            {openTasks.slice(0, 8).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2 text-xs">
                <span className="truncate text-sand-800">{t.titulo}</span>
                <span className="shrink-0 text-sand-400">{formatDate(t.prazo)} • {teamName(t.responsavelId).split(" ")[0]}</span>
              </div>
            ))}
            {openTasks.length === 0 && <p className="text-xs text-sand-400">Nenhuma tarefa aberta.</p>}
          </CardContent>
        </Card>
      </div>

      {docCategorias && (
        <Card className="mt-4">
          <CardHeader><CardTitle>Documentos recentes</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-4">
            {myDocs.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2 text-xs">
                <span className="truncate text-sand-800">{d.nome}</span>
                <span className="shrink-0 text-sand-400">{formatDate(d.dataArquivo)}</span>
              </div>
            ))}
            {myDocs.length === 0 && <p className="text-xs text-sand-400">Nenhum documento nesta categoria.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
