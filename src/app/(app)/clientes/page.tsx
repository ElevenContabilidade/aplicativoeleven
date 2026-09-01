"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { teamName } from "@/lib/data/seed";
import { CLIENT_STATUS, type Client, type ClientStatus } from "@/lib/types";
import { formatCurrency, initials, cn } from "@/lib/utils";

type ViewMode = "quadro" | "nicho" | "cidade" | "estado" | "regime" | "honorario";

const VIEWS: { value: ViewMode; label: string }[] = [
  { value: "quadro", label: "Quadro geral" },
  { value: "nicho", label: "Nicho" },
  { value: "cidade", label: "Cidade" },
  { value: "estado", label: "Estado" },
  { value: "regime", label: "Enquadramento" },
  { value: "honorario", label: "Honorário" },
];

const FAIXAS_HONORARIO: { label: string; test: (v: number) => boolean }[] = [
  { label: "Até R$ 500", test: (v) => v <= 500 },
  { label: "R$ 500 – R$ 1.000", test: (v) => v > 500 && v <= 1000 },
  { label: "R$ 1.000 – R$ 2.000", test: (v) => v > 1000 && v <= 2000 },
  { label: "Acima de R$ 2.000", test: (v) => v > 2000 },
];

function groupKey(client: Client, view: ViewMode): string {
  switch (view) {
    case "nicho":
      return client.segmento || "Sem nicho";
    case "cidade":
      return client.dados.municipio || "Sem cidade";
    case "estado":
      return client.dados.estado || "Sem estado";
    case "regime":
      return client.dados.regimeTributario;
    case "honorario":
      return FAIXAS_HONORARIO.find((f) => f.test(client.financeiro.valorMensal))?.label ?? "Sem valor";
    default:
      return "Todos";
  }
}

export default function ClientesPage() {
  const allClients = useAppStore((s) => s.clients);
  const team = useAppStore((s) => s.team);
  const authKind = useAuthStore((s) => s.kind);
  const authUserId = useAuthStore((s) => s.userId);

  /** Um colaborador com "empresas vinculadas" cadastradas em Equipe só vê
   * essas — sem nenhuma vinculada, vê a carteira toda normalmente. */
  const clients = useMemo(() => {
    if (authKind !== "equipe") return allClients;
    const vinculados = team.find((m) => m.id === authUserId)?.clientesVinculados;
    if (!vinculados || vinculados.length === 0) return allClients;
    const allowed = new Set(vinculados);
    return allClients.filter((c) => allowed.has(c.id));
  }, [allClients, team, authKind, authUserId]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"Todos" | ClientStatus>("Todos");
  const [view, setView] = useState<ViewMode>("quadro");

  const searchParams = useSearchParams();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(() => searchParams.get("novo") === "1");

  useEffect(() => {
    if (searchParams.get("novo") === "1") router.replace("/clientes");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { Todos: clients.length };
    for (const s of CLIENT_STATUS) counts[s] = clients.filter((c) => c.status === s).length;
    return counts;
  }, [clients]);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchesQuery =
        query.trim() === "" ||
        c.dados.razaoSocial.toLowerCase().includes(query.toLowerCase()) ||
        (c.dados.nomeFantasia ?? "").toLowerCase().includes(query.toLowerCase()) ||
        c.dados.cnpj.includes(query);
      const matchesStatus = status === "Todos" || c.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [clients, query, status]);

  const groups = useMemo(() => {
    if (view === "quadro") return null;
    const map = new Map<string, Client[]>();
    for (const c of filtered) {
      const key = groupKey(c, view);
      map.set(key, [...(map.get(key) ?? []), c]);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered, view]);

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${clients.length} clientes cadastrados na carteira da Eleven.`}
        actions={<Button onClick={() => setFormOpen(true)}><Plus className="size-3.5" /> Novo cliente</Button>}
      />

      <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)} className="mb-4">
        <TabsList>
          {VIEWS.map((v) => (
            <TabsTrigger key={v.value} value={v.value}>{v.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
          <Input placeholder="Buscar por razão social, nome ou CNPJ" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <StatusChip label={`Todos (${statusCounts.Todos})`} active={status === "Todos"} onClick={() => setStatus("Todos")} />
        {CLIENT_STATUS.filter((s) => statusCounts[s] > 0).map((s) => (
          <StatusChip key={s} label={`${s} (${statusCounts[s]})`} active={status === s} onClick={() => setStatus(s)} />
        ))}
      </div>

      {view === "quadro" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Segmento</TableHead>
              <TableHead>Regime</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Mensalidade</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link href={`/clientes/${c.id}`} className="flex items-center gap-2.5 hover:underline">
                    <Avatar className="size-8">
                      <AvatarFallback>{initials(c.dados.nomeFantasia ?? c.dados.razaoSocial)}</AvatarFallback>
                    </Avatar>
                    <span>
                      <span className="block font-medium text-sand-900">{c.dados.nomeFantasia ?? c.dados.razaoSocial}</span>
                      <span className="block text-[11px] text-sand-400">{c.dados.cnpj}</span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell>{c.segmento}</TableCell>
                <TableCell>{c.dados.regimeTributario}</TableCell>
                <TableCell>{c.responsaveis.relacionamento ? teamName(c.responsaveis.relacionamento) : "—"}</TableCell>
                <TableCell>{formatCurrency(c.financeiro.valorMensal)}</TableCell>
                <TableCell>
                  <StatusBadge status={c.status} />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sand-400">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {(groups ?? []).map(([key, items]) => (
            <div key={key} className="w-72 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-sand-500">{key}</h3>
                <span className="text-[11px] font-medium text-sand-400">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((c) => (
                  <Link key={c.id} href={`/clientes/${c.id}`}>
                    <Card className="transition-colors hover:border-wine-300">
                      <CardContent className="space-y-1.5 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-sand-900">{c.dados.nomeFantasia ?? c.dados.razaoSocial}</span>
                            <span className="block text-[11px] text-sand-400">{c.dados.cnpj}</span>
                          </span>
                          <StatusBadge status={c.status} />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-sand-500">
                          <span>{c.dados.municipio}/{c.dados.estado}</span>
                          <span className="font-medium text-sand-700">{formatCurrency(c.financeiro.valorMensal)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {(groups ?? []).length === 0 && <p className="py-10 text-center text-sand-400">Nenhum cliente encontrado.</p>}
        </div>
      )}

      <ClientFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}

function StatusChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
        active ? "border-wine-600 bg-wine-700 text-cream-50" : "border-sand-300 bg-white text-sand-600 hover:bg-sand-100"
      )}
    >
      {label}
    </button>
  );
}
