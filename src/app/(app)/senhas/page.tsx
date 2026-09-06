"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { KeyRound, Search, Eye, EyeOff, Copy, Check, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";

type TipoAcesso = "Portal Nacional / Prefeitura" | "gov.br" | "Certificado digital";

const TIPOS: TipoAcesso[] = ["Portal Nacional / Prefeitura", "gov.br", "Certificado digital"];

interface AcessoSenha {
  id: string;
  clienteId: string;
  clienteNome: string;
  tipo: TipoAcesso;
  usuario?: string;
  senha: string;
  detalhe?: string;
}

function useAcessos(): AcessoSenha[] {
  const clients = useAppStore((s) => s.clients);
  const certificados = useAppStore((s) => s.certificados);

  return useMemo(() => {
    const linhas: AcessoSenha[] = [];

    for (const c of clients) {
      const nome = c.dados.nomeFantasia || c.dados.razaoSocial;

      if (c.dados.senhaPrefeituraPortalNacional) {
        linhas.push({
          id: `portal-${c.id}`,
          clienteId: c.id,
          clienteNome: nome,
          tipo: "Portal Nacional / Prefeitura",
          usuario: c.dados.cnpj,
          senha: c.dados.senhaPrefeituraPortalNacional,
        });
      }

      for (const socio of c.socios) {
        if (socio.senhaGovBr) {
          linhas.push({
            id: `govbr-${socio.id}`,
            clienteId: c.id,
            clienteNome: nome,
            tipo: "gov.br",
            usuario: socio.cpf,
            senha: socio.senhaGovBr,
            detalhe: socio.nome,
          });
        }
      }
    }

    for (const cert of certificados) {
      if (!cert.senha) continue;
      const cliente = clients.find((c) => c.id === cert.clienteId);
      linhas.push({
        id: `cert-${cert.id}`,
        clienteId: cert.clienteId,
        clienteNome: cliente ? cliente.dados.nomeFantasia || cliente.dados.razaoSocial : "—",
        tipo: "Certificado digital",
        usuario: cert.documento,
        senha: cert.senha,
        detalhe: cert.tipo,
      });
    }

    return linhas.sort((a, b) => a.clienteNome.localeCompare(b.clienteNome));
  }, [clients, certificados]);
}

export default function SenhasPage() {
  const acessos = useAcessos();
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<TipoAcesso | "Todos">("Todos");
  const [visiveis, setVisiveis] = useState<Set<string>>(new Set());
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const linhas = useMemo(() => {
    return acessos.filter((a) => {
      if (tipoFiltro !== "Todos" && a.tipo !== tipoFiltro) return false;
      if (!busca.trim()) return true;
      const termo = busca.trim().toLowerCase();
      return a.clienteNome.toLowerCase().includes(termo) || (a.detalhe ?? "").toLowerCase().includes(termo);
    });
  }, [acessos, busca, tipoFiltro]);

  function toggleVisivel(id: string) {
    setVisiveis((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function copiar(id: string, senha: string) {
    try {
      await navigator.clipboard.writeText(senha);
      setCopiadoId(id);
      setTimeout(() => setCopiadoId((cur) => (cur === id ? null : cur)), 2000);
    } catch {
      // clipboard indisponível — usuário copia manualmente pela senha revelada
    }
  }

  const clientesComAcesso = new Set(acessos.map((a) => a.clienteId)).size;

  return (
    <div>
      <PageHeader
        title="Senhas"
        description="Cofre com os acessos de cada cliente (gov.br, Portal Nacional/Prefeitura, certificado digital) reunidos num só lugar pra consulta rápida."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Acessos cadastrados" value={acessos.length} icon={KeyRound} tone="wine" />
        <MetricCard label="Clientes com ao menos 1 acesso" value={clientesComAcesso} icon={KeyRound} tone="neutral" />
        <MetricCard label="Certificados com senha salva" value={acessos.filter((a) => a.tipo === "Certificado digital").length} icon={KeyRound} tone="success" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Filtrar por cliente ou sócio" className="pl-8" />
        </div>
        <Select value={tipoFiltro} onValueChange={(v) => setTipoFiltro(v as TipoAcesso | "Todos")}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os tipos</SelectItem>
            {TIPOS.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acessos ({linhas.length})</CardTitle>
          <p className="mt-1 text-xs text-sand-500">
            As senhas aqui vêm do cadastro de cada cliente (Sócios &amp; contatos, Dados cadastrais, Certificados) — pra
            alterar, edite lá.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="w-48">Tipo de acesso</TableHead>
                <TableHead>Usuário / CPF-CNPJ</TableHead>
                <TableHead className="w-56">Senha</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((a) => {
                const visivel = visiveis.has(a.id);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      <Link href={`/clientes/${a.clienteId}`} className="hover:text-wine-700 hover:underline">
                        {a.clienteNome}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {a.tipo}
                      {a.detalhe && <span className="block text-[11px] text-sand-400">{a.detalhe}</span>}
                    </TableCell>
                    <TableCell className="font-mono text-[11px]">{a.usuario || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs">{visivel ? a.senha : "•".repeat(Math.min(a.senha.length, 10))}</span>
                        <button
                          type="button"
                          onClick={() => toggleVisivel(a.id)}
                          title={visivel ? "Ocultar senha" : "Mostrar senha"}
                          className="rounded-md p-1 text-sand-400 hover:bg-sand-100 hover:text-sand-700"
                        >
                          {visivel ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => void copiar(a.id, a.senha)}
                          title="Copiar senha"
                          className="rounded-md p-1 text-sand-400 hover:bg-sand-100 hover:text-wine-700"
                        >
                          {copiadoId === a.id ? <Check className="size-3.5 text-status-success" /> : <Copy className="size-3.5" />}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/clientes/${a.clienteId}`}
                        title="Editar no cadastro do cliente"
                        className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-wine-700"
                      >
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {linhas.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sand-400">Nenhum acesso cadastrado ainda.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
