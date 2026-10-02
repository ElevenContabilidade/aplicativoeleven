"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, UploadCloud, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { uploadDocumento } from "@/lib/upload-documento";
import { statusAutomaticoCertificado, type Certificado, type Client } from "@/lib/types";
import { extractPdfText } from "@/lib/pdf-text";
import { extractDocumentDates } from "@/lib/document-date-extract";
import { extractPfxDates } from "@/lib/pfx-dates";
import { onlyDigits, maskCnpjCpf } from "@/lib/cnpj";
import { formatBytes } from "@/lib/utils";

const TIPOS: Certificado["tipo"][] = ["e-CPF A1", "e-CNPJ A1", "e-CPF A3", "e-CNPJ A3"];

interface Rascunho {
  key: string;
  file: File;
  clienteId: string;
  tipo: Certificado["tipo"];
  documento: string;
  dataEmissao: string;
  dataVencimento: string;
  valor: string;
  senha: string;
  avisoExtracao?: string;
}

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/** Tenta adivinhar o cliente dono do certificado pelo nome do arquivo — por
 * CNPJ/CPF embutido no nome, ou por conter o nome fantasia/razão social.
 * Sempre fica editável depois, isso é só um ponto de partida. */
function adivinharCliente(nomeArquivo: string, clients: Client[]): Client | undefined {
  const base = nomeArquivo.replace(/\.[^.]+$/, "");
  const digits = onlyDigits(base);
  const porDocumento = clients.find((c) => {
    const cnpjDigits = onlyDigits(c.dados.cnpj);
    return cnpjDigits.length >= 11 && digits.includes(cnpjDigits);
  });
  if (porDocumento) return porDocumento;

  const normBase = normalizar(base);
  return clients.find((c) => {
    const normNome = normalizar(c.dados.nomeFantasia ?? "");
    const normRazao = normalizar(c.dados.razaoSocial ?? "");
    return (normNome.length >= 4 && normBase.includes(normNome)) || (normRazao.length >= 4 && normBase.includes(normRazao));
  });
}

function adivinharTipo(nomeArquivo: string): Certificado["tipo"] {
  const upper = nomeArquivo.toUpperCase();
  const isCpf = /E[-_]?CPF|\bCPF\b/.test(upper);
  const isA3 = /\bA3\b/.test(upper);
  if (isCpf) return isA3 ? "e-CPF A3" : "e-CPF A1";
  return isA3 ? "e-CNPJ A3" : "e-CNPJ A1";
}

async function montarRascunho(file: File, clients: Client[]): Promise<Rascunho> {
  const cliente = adivinharCliente(file.name, clients);
  const key = `${file.name}-${file.size}-${file.lastModified}`;

  let dataEmissao = "";
  let dataVencimento = "";
  let avisoExtracao: string | undefined;

  const name = file.name.toLowerCase();
  const isPfx = name.endsWith(".pfx") || name.endsWith(".p12");
  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
  try {
    if (isPfx) {
      const dates = await extractPfxDates(file);
      dataEmissao = dates.dataEmissao ?? "";
      dataVencimento = dates.dataVencimento ?? "";
    } else if (isPdf) {
      const dates = extractDocumentDates(await extractPdfText(file));
      dataEmissao = dates.dataEmissao ?? "";
      dataVencimento = dates.dataVencimento ?? "";
    } else {
      avisoExtracao = "Formato não lido automaticamente — preencha as datas.";
    }
    if (!dataEmissao && !dataVencimento && !avisoExtracao) {
      avisoExtracao = "Datas não encontradas — confira manualmente.";
    }
  } catch {
    avisoExtracao = "Não foi possível ler este arquivo — preencha as datas manualmente.";
  }

  return {
    key,
    file,
    clienteId: cliente?.id ?? "",
    tipo: adivinharTipo(file.name),
    documento: cliente?.dados.cnpj ?? "",
    dataEmissao,
    dataVencimento,
    valor: "220",
    senha: "",
    avisoExtracao,
  };
}

export function CertificadoBulkImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const clients = useAppStore((s) => s.clients);
  const addCertificado = useAppStore((s) => s.addCertificado);
  const addDocumento = useAppStore((s) => s.addDocumento);
  const { userId } = useAuthStore();

  const [rascunhos, setRascunhos] = useState<Rascunho[]>([]);
  const [lendo, setLendo] = useState(false);
  const [importando, setImportando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [resultado, setResultado] = useState<{ sucesso: number; erros: { nome: string; motivo: string }[] } | null>(null);

  function reset() {
    setRascunhos([]);
    setResultado(null);
    setProgresso(0);
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setResultado(null);
    setLendo(true);
    try {
      const novos = await Promise.all(Array.from(fileList).map((f) => montarRascunho(f, clients)));
      setRascunhos((atual) => [...atual, ...novos.filter((n) => !atual.some((a) => a.key === n.key))]);
    } finally {
      setLendo(false);
    }
  }

  function updateRascunho(key: string, patch: Partial<Rascunho>) {
    setRascunhos((atual) => atual.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removerRascunho(key: string) {
    setRascunhos((atual) => atual.filter((r) => r.key !== key));
  }

  const prontos = rascunhos.filter((r) => r.clienteId && r.dataVencimento);
  const incompletos = rascunhos.length - prontos.length;

  async function handleImportar() {
    if (prontos.length === 0) return;
    setImportando(true);
    setProgresso(0);
    const erros: { nome: string; motivo: string }[] = [];
    const importadosKeys: string[] = [];

    for (const r of prontos) {
      const cliente = clients.find((c) => c.id === r.clienteId);
      if (!cliente) {
        erros.push({ nome: r.file.name, motivo: "Cliente não encontrado." });
        continue;
      }
      try {
        const doc = await uploadDocumento({
          file: r.file,
          clienteId: r.clienteId,
          clienteNome: cliente.dados.nomeFantasia ?? cliente.dados.razaoSocial,
          categoria: "Certificados",
          responsavelId: userId ?? undefined,
        });
        addDocumento(doc);
        addCertificado({
          id: `cert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          clienteId: r.clienteId,
          documento: r.documento,
          tipo: r.tipo,
          dataEmissao: r.dataEmissao || undefined,
          dataVencimento: r.dataVencimento,
          status: statusAutomaticoCertificado(r.dataVencimento),
          valor: Number(r.valor) || 0,
          senha: r.senha || undefined,
          responsavelId: userId ?? "u7",
          documentoId: doc.id,
        });
        importadosKeys.push(r.key);
      } catch (err) {
        erros.push({ nome: r.file.name, motivo: err instanceof Error ? err.message : "Falha ao enviar o arquivo." });
      }
      setProgresso((n) => n + 1);
    }

    setRascunhos((atual) => atual.filter((r) => !importadosKeys.includes(r.key)));
    setResultado({ sucesso: importadosKeys.length, erros });
    setImportando(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !importando) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importar certificados em lote</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sand-300 bg-sand-50 px-4 py-6 text-center hover:border-wine-400 hover:bg-wine-50">
            <UploadCloud className="size-5 text-wine-500" />
            <span className="text-xs font-medium text-sand-700">
              {lendo ? "Lendo arquivos..." : "Clique para selecionar vários certificados (.pfx, .p12 ou PDF) de uma vez"}
            </span>
            <input
              type="file"
              accept=".pfx,.p12,.pdf,image/*"
              multiple
              className="hidden"
              disabled={lendo || importando}
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>

          {resultado && (
            <div className="rounded-lg border border-sand-200 bg-sand-50 p-3 text-xs">
              <p className="flex items-center gap-1.5 font-medium text-status-success">
                <CheckCircle2 className="size-3.5" /> {resultado.sucesso} certificado{resultado.sucesso === 1 ? "" : "s"} importado{resultado.sucesso === 1 ? "" : "s"} com sucesso.
              </p>
              {resultado.erros.length > 0 && (
                <div className="mt-1.5 text-status-danger">
                  <p className="flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="size-3.5" /> {resultado.erros.length} falharam — continuam na lista abaixo pra você tentar de novo:
                  </p>
                  <ul className="ml-5 list-disc">
                    {resultado.erros.map((e, i) => (<li key={i}>{e.nome}: {e.motivo}</li>))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {rascunhos.length > 0 && (
            <>
              <p className="text-[11px] text-sand-500">
                Tentei adivinhar o cliente e o tipo pelo nome de cada arquivo e já li as datas do próprio certificado — confira e ajuste antes de importar. Senha não é lida automaticamente (fica dentro do arquivo), preencha se quiser deixá-la salva.
                {incompletos > 0 && (
                  <span className="ml-1 font-medium text-status-warning">
                    {incompletos} arquivo{incompletos === 1 ? "" : "s"} sem cliente e/ou vencimento definido — não {incompletos === 1 ? "vai" : "vão"} ser importado{incompletos === 1 ? "" : "s"} até preencher.
                  </span>
                )}
              </p>
              <div className="max-h-96 overflow-y-auto rounded-lg border border-sand-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Arquivo</TableHead>
                      <TableHead className="w-48">Cliente</TableHead>
                      <TableHead className="w-28">Tipo</TableHead>
                      <TableHead className="w-32">CPF/CNPJ</TableHead>
                      <TableHead className="w-32">Emissão</TableHead>
                      <TableHead className="w-32">Vencimento</TableHead>
                      <TableHead className="w-20">Valor</TableHead>
                      <TableHead className="w-28">Senha</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rascunhos.map((r) => (
                      <TableRow key={r.key} className={!r.clienteId || !r.dataVencimento ? "bg-status-warning-bg/40" : undefined}>
                        <TableCell className="max-w-40">
                          <span className="block truncate text-xs font-medium text-sand-800" title={r.file.name}>{r.file.name}</span>
                          <span className="text-[10px] text-sand-400">{formatBytes(r.file.size)}</span>
                          {r.avisoExtracao && <span className="block text-[10px] text-status-warning">{r.avisoExtracao}</span>}
                        </TableCell>
                        <TableCell>
                          <Select value={r.clienteId} onValueChange={(v) => {
                            const cliente = clients.find((c) => c.id === v);
                            updateRascunho(r.key, { clienteId: v, documento: cliente?.dados.cnpj ?? r.documento });
                          }}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                            <SelectContent>
                              {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.dados.nomeFantasia ?? c.dados.razaoSocial}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={r.tipo} onValueChange={(v) => updateRascunho(r.key, { tipo: v as Certificado["tipo"] })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {TIPOS.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={r.documento}
                            onChange={(e) => updateRascunho(r.key, { documento: maskCnpjCpf(e.target.value) })}
                            className="h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input type="date" value={r.dataEmissao} onChange={(e) => updateRascunho(r.key, { dataEmissao: e.target.value })} className="h-8 text-xs" />
                        </TableCell>
                        <TableCell>
                          <Input type="date" value={r.dataVencimento} onChange={(e) => updateRascunho(r.key, { dataVencimento: e.target.value })} className="h-8 text-xs" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={r.valor} onChange={(e) => updateRascunho(r.key, { valor: e.target.value })} className="h-8 w-16 text-xs" />
                        </TableCell>
                        <TableCell>
                          <Input type="password" value={r.senha} onChange={(e) => updateRascunho(r.key, { senha: e.target.value })} placeholder="Opcional" className="h-8 text-xs" />
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => removerRascunho(r.key)}
                            title="Remover da lista"
                            className="flex size-6 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
                          >
                            <X className="size-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {importando && (
            <p className="flex items-center gap-1.5 text-xs text-sand-500">
              <Loader2 className="size-3.5 animate-spin" /> Enviando {progresso} de {prontos.length}...
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={importando}>Fechar</Button>
          {rascunhos.length > 0 && (
            <Button type="button" onClick={handleImportar} disabled={importando || prontos.length === 0}>
              {importando ? "Importando..." : `Importar ${prontos.length} certificado${prontos.length === 1 ? "" : "s"}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
