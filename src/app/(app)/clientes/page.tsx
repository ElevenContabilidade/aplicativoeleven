"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/data/seed";
import { CLIENT_STATUS } from "@/lib/types";
import { formatCurrency, initials } from "@/lib/utils";

export default function ClientesPage() {
  const clients = useAppStore((s) => s.clients);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("Todos");

  const searchParams = useSearchParams();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(() => searchParams.get("novo") === "1");

  useEffect(() => {
    if (searchParams.get("novo") === "1") router.replace("/clientes");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${clients.length} clientes cadastrados na carteira da Eleven.`}
        actions={<Button onClick={() => setFormOpen(true)}><Plus className="size-3.5" /> Novo cliente</Button>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
          <Input placeholder="Buscar por razão social, nome ou CNPJ" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os status</SelectItem>
            {CLIENT_STATUS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

      <ClientFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
