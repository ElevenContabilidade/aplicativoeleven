"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Plus, Search, Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/data/seed";
import { useAuthStore } from "@/lib/store/auth-store";
import type { DocumentoCategoria } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const CATEGORIAS: DocumentoCategoria[] = ["Contratos", "Documentos societários", "Certificados", "Procurações", "Guias", "Folha", "Fiscal", "Contábil", "Relatórios", "Comprovantes", "Outros"];

export default function DocumentosPage() {
  const documentos = useAppStore((s) => s.documentos);
  const clients = useAppStore((s) => s.clients);
  const addDocumento = useAppStore((s) => s.addDocumento);
  const { userId } = useAuthStore();

  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [uploadOpen, setUploadOpen] = useState(() => searchParams.get("novo") === "1");
  const [uploadNome, setUploadNome] = useState("");
  const [uploadCliente, setUploadCliente] = useState(clients[0]?.id ?? "");
  const [uploadCategoria, setUploadCategoria] = useState<DocumentoCategoria>("Outros");

  useEffect(() => {
    if (searchParams.get("novo") === "1") router.replace("/documentos");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return documentos
      .filter((d) => {
        const client = clients.find((c) => c.id === d.clienteId);
        const q = query.trim().toLowerCase();
        const matchesQuery = q === "" || d.nome.toLowerCase().includes(q) || (client?.dados.razaoSocial ?? "").toLowerCase().includes(q);
        const matchesCategoria = categoria === "Todas" || d.categoria === categoria;
        return matchesQuery && matchesCategoria;
      })
      .sort((a, b) => b.dataArquivo.localeCompare(a.dataArquivo));
  }, [documentos, clients, query, categoria]);

  function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadNome || !uploadCliente) return;
    addDocumento({
      id: `d-${Date.now()}`,
      clienteId: uploadCliente,
      nome: uploadNome,
      categoria: uploadCategoria,
      dataArquivo: new Date().toISOString().slice(0, 10),
      responsavelId: userId ?? "u1",
      tamanho: "—",
    });
    setUploadNome("");
    setUploadOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Documentos"
        description="Central de documentos vinculados aos clientes: contratos, guias, certificados e mais."
        actions={<Button onClick={() => setUploadOpen(true)}><Plus className="size-3.5" /> Novo documento</Button>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
          <Input placeholder="Buscar documento ou cliente" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas as categorias</SelectItem>
            {CATEGORIAS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Documento</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Tamanho</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((d) => {
            const client = clients.find((c) => c.id === d.clienteId);
            return (
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
              </TableRow>
            );
          })}
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={6} className="py-10 text-center text-sand-400">Nenhum documento encontrado.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="size-4 text-wine-600" /> Novo documento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-3">
            <div>
              <Label className="mb-1 block">Nome do arquivo</Label>
              <Input value={uploadNome} onChange={(e) => setUploadNome(e.target.value)} placeholder="Ex: Contrato Social.pdf" required />
            </div>
            <div>
              <Label className="mb-1 block">Cliente</Label>
              <Select value={uploadCliente} onValueChange={setUploadCliente}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.dados.nomeFantasia ?? c.dados.razaoSocial}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Categoria</Label>
              <Select value={uploadCategoria} onValueChange={(v) => setUploadCategoria(v as DocumentoCategoria)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar documento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
