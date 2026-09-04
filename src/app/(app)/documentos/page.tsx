"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Plus, Search, ArrowUp, ArrowDown, ArrowUpDown, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DocumentUploadDialog, DOCUMENT_CATEGORIAS } from "@/components/documents/document-upload-dialog";
import { DocumentActions } from "@/components/documents/document-actions";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/team-lookup";
import { formatDate, cn } from "@/lib/utils";

type SortColumn = "nome" | "cliente" | "categoria" | "data" | "responsavel" | "tamanho";

function tamanhoToBytes(tamanho: string): number {
  const match = tamanho.match(/^([\d.]+)\s*(B|KB|MB)$/i);
  if (!match) return 0;
  const valor = Number(match[1]);
  const unidade = match[2].toUpperCase();
  if (unidade === "MB") return valor * 1024 * 1024;
  if (unidade === "KB") return valor * 1024;
  return valor;
}

function SortableHead({
  label,
  column,
  sort,
  onSort,
  className,
}: {
  label: string;
  column: SortColumn;
  sort: { column: SortColumn; direction: "asc" | "desc" } | null;
  onSort: (column: SortColumn) => void;
  className?: string;
}) {
  const active = sort?.column === column;
  const Icon = active ? (sort!.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn("flex items-center gap-1 uppercase tracking-wide hover:text-wine-700", active && "text-wine-700")}
      >
        {label}
        <Icon className={cn("size-3", !active && "text-sand-300")} />
      </button>
    </TableHead>
  );
}

export default function DocumentosPage() {
  const documentos = useAppStore((s) => s.documentos);
  const clients = useAppStore((s) => s.clients);

  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [uploadOpen, setUploadOpen] = useState(() => searchParams.get("novo") === "1");
  const [sort, setSort] = useState<{ column: SortColumn; direction: "asc" | "desc" } | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [sincronizarMsg, setSincronizarMsg] = useState<string | null>(null);

  async function sincronizarTodosClientes() {
    setSincronizando(true);
    setSincronizarMsg(null);
    let importados = 0;
    let falhas = 0;
    for (const c of clients) {
      const nome = c.dados.nomeFantasia || c.dados.razaoSocial;
      if (!nome) continue;
      try {
        const res = await fetch("/api/documentos/sincronizar-drive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clienteId: c.id, clienteNome: nome }),
        });
        const json = await res.json();
        if (json.ok) importados += json.importados ?? 0;
        else falhas += 1;
      } catch {
        falhas += 1;
      }
    }
    setSincronizando(false);
    setSincronizarMsg(
      falhas > 0
        ? `${importados} documento${importados === 1 ? "" : "s"} importado${importados === 1 ? "" : "s"} do Drive (${falhas} cliente${falhas === 1 ? "" : "s"} com erro).`
        : `${importados} documento${importados === 1 ? "" : "s"} importado${importados === 1 ? "" : "s"} do Drive.`
    );
  }

  useEffect(() => {
    if (searchParams.get("novo") === "1") router.replace("/documentos");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSort(column: SortColumn) {
    setSort((s) => (s?.column === column ? { column, direction: s.direction === "asc" ? "desc" : "asc" } : { column, direction: "asc" }));
  }

  const filtered = useMemo(() => {
    const list = documentos
      .filter((d) => {
        const client = clients.find((c) => c.id === d.clienteId);
        const q = query.trim().toLowerCase();
        const matchesQuery = q === "" || d.nome.toLowerCase().includes(q) || (client?.dados.razaoSocial ?? "").toLowerCase().includes(q);
        const matchesCategoria = categoria === "Todas" || d.categoria === categoria;
        return matchesQuery && matchesCategoria;
      })
      .map((d) => ({ documento: d, cliente: clients.find((c) => c.id === d.clienteId) }));

    if (!sort) return list.sort((a, b) => b.documento.dataArquivo.localeCompare(a.documento.dataArquivo));

    const dir = sort.direction === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      switch (sort.column) {
        case "nome":
          return a.documento.nome.localeCompare(b.documento.nome, "pt-BR") * dir;
        case "cliente": {
          const an = a.cliente?.dados.nomeFantasia ?? a.cliente?.dados.razaoSocial ?? "";
          const bn = b.cliente?.dados.nomeFantasia ?? b.cliente?.dados.razaoSocial ?? "";
          return an.localeCompare(bn, "pt-BR") * dir;
        }
        case "categoria":
          return a.documento.categoria.localeCompare(b.documento.categoria, "pt-BR") * dir;
        case "data":
          return a.documento.dataArquivo.localeCompare(b.documento.dataArquivo) * dir;
        case "responsavel":
          return teamName(a.documento.responsavelId).localeCompare(teamName(b.documento.responsavelId), "pt-BR") * dir;
        case "tamanho":
          return (tamanhoToBytes(a.documento.tamanho) - tamanhoToBytes(b.documento.tamanho)) * dir;
        default:
          return 0;
      }
    });
  }, [documentos, clients, query, categoria, sort]);

  return (
    <div>
      <PageHeader
        title="Documentos"
        description="Central de documentos vinculados aos clientes: contratos, guias, certificados e mais."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={sincronizarTodosClientes} disabled={sincronizando}>
              <RefreshCw className={cn("size-3.5", sincronizando && "animate-spin")} />
              {sincronizando ? "Sincronizando..." : "Sincronizar com Drive"}
            </Button>
            <Button onClick={() => setUploadOpen(true)}><Plus className="size-3.5" /> Novo documento</Button>
          </div>
        }
      />

      {sincronizarMsg && <p className="mb-3 text-xs text-sand-500">{sincronizarMsg}</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
          <Input placeholder="Buscar documento ou cliente" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas as categorias</SelectItem>
            {DOCUMENT_CATEGORIAS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead label="Documento" column="nome" sort={sort} onSort={toggleSort} />
            <SortableHead label="Cliente" column="cliente" sort={sort} onSort={toggleSort} />
            <SortableHead label="Categoria" column="categoria" sort={sort} onSort={toggleSort} />
            <SortableHead label="Data" column="data" sort={sort} onSort={toggleSort} />
            <SortableHead label="Responsável" column="responsavel" sort={sort} onSort={toggleSort} />
            <SortableHead label="Tamanho" column="tamanho" sort={sort} onSort={toggleSort} />
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(({ documento: d, cliente: client }) => (
            <TableRow key={d.id}>
              <TableCell>
                <span className="flex items-center gap-2 font-medium text-sand-900">
                  <FileText className="size-3.5 shrink-0 text-wine-500" /> {d.nome}
                </span>
              </TableCell>
              <TableCell>{client?.dados.nomeFantasia ?? client?.dados.razaoSocial}</TableCell>
              <TableCell><Badge variant="outline">{d.categoria}</Badge></TableCell>
              <TableCell>{formatDate(d.dataArquivo)}</TableCell>
              <TableCell>{teamName(d.responsavelId)}</TableCell>
              <TableCell className="text-sand-400">{d.tamanho}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  <DocumentActions documento={d} />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={7} className="py-10 text-center text-sand-400">Nenhum documento encontrado.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <DocumentUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
