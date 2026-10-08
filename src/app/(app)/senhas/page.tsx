"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { KeyRound, Search, Eye, EyeOff, Copy, Check, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import type { Client } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Sócio cujo CPF/gov.br faz sentido usar como login principal da empresa
 * — prioriza o administrador, depois o representante legal, senão o
 * primeiro sócio cadastrado. Mesma regra do checklist Fiscal. */
function socioResponsavel(client: Client) {
  return client.socios?.find((s) => s.administrador) ?? client.socios?.find((s) => s.representanteLegal) ?? client.socios?.[0];
}

interface LinhaAcesso {
  clienteId: string;
  clienteNome: string;
  cnpj: string;
  socioNome?: string;
  cpf?: string;
  senhaGov?: string;
  senhaPrefeitura?: string;
  codigoAcessoSn?: string;
  senhaCertificado?: string;
  tipoCertificado?: string;
}

function useAcessosPorCliente(): LinhaAcesso[] {
  const clients = useAppStore((s) => s.clients);
  const certificados = useAppStore((s) => s.certificados);

  return useMemo(() => {
    return clients
      .map((c) => {
        const socio = socioResponsavel(c);
        const cert = certificados.find((cf) => cf.clienteId === c.id && cf.senha);
        return {
          clienteId: c.id,
          clienteNome: c.dados.nomeFantasia || c.dados.razaoSocial,
          cnpj: c.dados.cnpj,
          socioNome: socio?.nome,
          cpf: socio?.cpf,
          senhaGov: socio?.senhaGovBr,
          senhaPrefeitura: c.dados.senhaPrefeituraPortalNacional,
          codigoAcessoSn: c.dados.codigoAcessoSimplesNacional,
          senhaCertificado: cert?.senha,
          tipoCertificado: cert?.tipo,
        };
      })
      .filter((l) => l.senhaGov || l.senhaPrefeitura || l.codigoAcessoSn || l.senhaCertificado)
      .sort((a, b) => a.clienteNome.localeCompare(b.clienteNome, "pt-BR"));
  }, [clients, certificados]);
}

function SenhaCell({ id, valor, visivel, onToggle, onCopiar, copiado }: {
  id: string;
  valor?: string;
  visivel: boolean;
  onToggle: (id: string) => void;
  onCopiar: (id: string, valor: string) => void;
  copiado: boolean;
}) {
  if (!valor) return <span className="text-sand-300">—</span>;
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-[11px]">{visivel ? valor : "•".repeat(Math.min(valor.length, 10))}</span>
      <button type="button" onClick={() => onToggle(id)} title={visivel ? "Ocultar" : "Mostrar"} className="rounded p-0.5 text-sand-400 hover:bg-sand-100 hover:text-sand-700">
        {visivel ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
      </button>
      <button type="button" onClick={() => onCopiar(id, valor)} title="Copiar" className="rounded p-0.5 text-sand-400 hover:bg-sand-100 hover:text-wine-700">
        {copiado ? <Check className="size-3 text-status-success" /> : <Copy className="size-3" />}
      </button>
    </div>
  );
}

export default function SenhasPage() {
  const linhas = useAcessosPorCliente();
  const senhasPortais = useAppStore((s) => s.senhasPortais);
  const [busca, setBusca] = useState("");
  const [visiveis, setVisiveis] = useState<Set<string>>(new Set());
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return linhas;
    return linhas.filter(
      (l) =>
        l.clienteNome.toLowerCase().includes(termo) ||
        l.cnpj.toLowerCase().includes(termo) ||
        (l.socioNome ?? "").toLowerCase().includes(termo) ||
        (l.cpf ?? "").toLowerCase().includes(termo)
    );
  }, [linhas, busca]);

  function toggleVisivel(id: string) {
    setVisiveis((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function copiar(id: string, valor: string) {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiadoId(id);
      setTimeout(() => setCopiadoId((cur) => (cur === id ? null : cur)), 2000);
    } catch {
      // clipboard indisponível — usuário copia manualmente pelo valor revelado
    }
  }

  const totalAcessos = linhas.reduce(
    (a, l) => a + [l.senhaGov, l.senhaPrefeitura, l.codigoAcessoSn, l.senhaCertificado].filter(Boolean).length,
    0
  );

  return (
    <div>
      <PageHeader
        title="Senhas"
        description="Cofre com os acessos de cada cliente (CPF, gov.br, Portal Nacional/Prefeitura, código de acesso SN/MEI e certificado digital) reunidos numa linha por empresa."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Clientes com ao menos 1 acesso" value={linhas.length} icon={KeyRound} tone="wine" />
        <MetricCard label="Acessos cadastrados" value={totalAcessos} icon={KeyRound} tone="neutral" />
        <MetricCard label="Certificados com senha salva" value={linhas.filter((l) => l.senhaCertificado).length} icon={KeyRound} tone="success" />
      </div>

      <div className="mb-4 relative w-full max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
        <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Filtrar por cliente, CNPJ, sócio ou CPF" className="pl-8" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acessos ({filtradas.length})</CardTitle>
          <p className="mt-1 text-xs text-sand-500">
            As senhas aqui vêm do cadastro de cada cliente (Sócios &amp; contatos, Dados cadastrais, Certificados) — pra alterar, edite lá.
            CPF e senha gov.br são os do sócio administrador (ou representante legal/primeiro cadastrado, quando não há administrador marcado).
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <Table className="min-w-[1080px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Senha gov.br</TableHead>
                  <TableHead>Senha prefeitura/Portal Nacional</TableHead>
                  <TableHead>Código de acesso SN/MEI</TableHead>
                  <TableHead>Certificado digital</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((l) => (
                  <TableRow key={l.clienteId}>
                    <TableCell className="font-medium">
                      <Link href={`/clientes/${l.clienteId}`} className="hover:text-wine-700 hover:underline">
                        {l.clienteNome}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-sand-600">{l.cnpj || "—"}</TableCell>
                    <TableCell>
                      <span className="font-mono text-[11px] text-sand-600">{l.cpf || "—"}</span>
                      {l.socioNome && <span className="block text-[10px] text-sand-400">{l.socioNome}</span>}
                    </TableCell>
                    <TableCell>
                      <SenhaCell id={`${l.clienteId}-gov`} valor={l.senhaGov} visivel={visiveis.has(`${l.clienteId}-gov`)} onToggle={toggleVisivel} onCopiar={copiar} copiado={copiadoId === `${l.clienteId}-gov`} />
                    </TableCell>
                    <TableCell>
                      <SenhaCell id={`${l.clienteId}-prefeitura`} valor={l.senhaPrefeitura} visivel={visiveis.has(`${l.clienteId}-prefeitura`)} onToggle={toggleVisivel} onCopiar={copiar} copiado={copiadoId === `${l.clienteId}-prefeitura`} />
                    </TableCell>
                    <TableCell>
                      <SenhaCell id={`${l.clienteId}-sn`} valor={l.codigoAcessoSn} visivel={visiveis.has(`${l.clienteId}-sn`)} onToggle={toggleVisivel} onCopiar={copiar} copiado={copiadoId === `${l.clienteId}-sn`} />
                    </TableCell>
                    <TableCell>
                      <SenhaCell id={`${l.clienteId}-cert`} valor={l.senhaCertificado} visivel={visiveis.has(`${l.clienteId}-cert`)} onToggle={toggleVisivel} onCopiar={copiar} copiado={copiadoId === `${l.clienteId}-cert`} />
                      {l.tipoCertificado && <span className="block text-[10px] text-sand-400">{l.tipoCertificado}</span>}
                    </TableCell>
                    <TableCell>
                      <Link href={`/clientes/${l.clienteId}`} title="Editar no cadastro do cliente" className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-wine-700">
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {filtradas.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="py-10 text-center text-sand-400">Nenhum acesso cadastrado ainda.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {senhasPortais.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Portais do escritório</CardTitle>
            <p className="mt-1 text-xs text-sand-500">
              Acessos que não são de um cliente específico (ex: portal do contabilista) — pra alterar, edite em Dados do escritório.
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Portal</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Senha</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {senhasPortais.map((sp) => {
                  const id = `portal-${sp.id}`;
                  const visivel = visiveis.has(id);
                  return (
                    <TableRow key={sp.id}>
                      <TableCell className="font-medium">
                        {sp.nomePortal}
                        {sp.observacoes && <span className="block text-[11px] text-sand-400">{sp.observacoes}</span>}
                      </TableCell>
                      <TableCell className="font-mono text-[11px]">{sp.usuario || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs">{visivel ? sp.senha : "•".repeat(Math.min(sp.senha.length, 10))}</span>
                          <button type="button" onClick={() => toggleVisivel(id)} title={visivel ? "Ocultar senha" : "Mostrar senha"} className="rounded-md p-1 text-sand-400 hover:bg-sand-100 hover:text-sand-700">
                            {visivel ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </button>
                          <button type="button" onClick={() => void copiar(id, sp.senha)} title="Copiar senha" className={cn("rounded-md p-1 text-sand-400 hover:bg-sand-100 hover:text-wine-700")}>
                            {copiadoId === id ? <Check className="size-3.5 text-status-success" /> : <Copy className="size-3.5" />}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href="/dados-escritorio" title="Editar em Dados do escritório" className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-wine-700">
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
