"use client";

import { useState } from "react";
import { Upload, FileUp, Sparkles, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { uploadDocumento } from "@/lib/upload-documento";
import { statusAutomaticoCertificado, type Certificado, type DocumentoCategoria } from "@/lib/types";
import { extractPdfText } from "@/lib/pdf-text";
import { extractDocumentDates } from "@/lib/document-date-extract";
import { extractPfxDates } from "@/lib/pfx-dates";
import { formatBytes } from "@/lib/utils";

export const DOCUMENT_CATEGORIAS: DocumentoCategoria[] = [
  "Contratos",
  "Documentos societários",
  "Certificados",
  "Procurações",
  "Guias",
  "Folha",
  "Fiscal",
  "Contábil",
  "Relatórios",
  "Comprovantes",
  "Licenças",
  "Extratos bancários",
  "Notas fiscais",
  "Boletos",
  "Outros",
];

const TIPOS_CERTIFICADO: Certificado["tipo"][] = ["e-CPF A1", "e-CNPJ A1", "e-CPF A3", "e-CNPJ A3"];

type ExtractState = "idle" | "extracting" | "found" | "not-found" | "unsupported" | "error";

export function DocumentUploadDialog({
  open,
  onOpenChange,
  fixedClienteId,
  fixedCategoria,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** When set, the dialog is scoped to this client and skips the client picker. */
  fixedClienteId?: string;
  /** When set, the dialog uploads straight into this categoria (and its matching Drive folder) and skips the categoria picker. */
  fixedCategoria?: DocumentoCategoria;
}) {
  const clients = useAppStore((s) => s.clients);
  const addDocumento = useAppStore((s) => s.addDocumento);
  const addCertificado = useAppStore((s) => s.addCertificado);
  const { userId } = useAuthStore();

  const [file, setFile] = useState<File | null>(null);
  const [clienteId, setClienteId] = useState("");
  const [categoria, setCategoria] = useState<DocumentoCategoria>(fixedCategoria ?? "Outros");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Campos extras só usados quando a categoria é "Certificados" — sem eles o
  // arquivo ficava só anexado em Documentos, sem virar um certificado de
  // verdade em Certificados (sem vencimento rastreado, sem alerta).
  const [tipoCert, setTipoCert] = useState<Certificado["tipo"]>("e-CNPJ A1");
  const [dataEmissaoCert, setDataEmissaoCert] = useState("");
  const [dataVencimentoCert, setDataVencimentoCert] = useState("");
  const [valorCert, setValorCert] = useState("220");
  const [senhaCert, setSenhaCert] = useState("");
  const [extractState, setExtractState] = useState<ExtractState>("idle");

  const ehCertificado = categoria === "Certificados";

  // O atalho "+ Novo" do topbar pode abrir esse dialog já na carga da página
  // (?novo=1), antes de "clients" ter chegado do Supabase — calcular o
  // fallback pro primeiro cliente a cada render (em vez de travá-lo no
  // estado inicial) garante que resolve assim que a lista chegar.
  const effectiveClienteId = fixedClienteId || clienteId || clients[0]?.id || "";
  const cliente = clients.find((c) => c.id === effectiveClienteId);

  function reset() {
    setFile(null);
    setCategoria(fixedCategoria ?? "Outros");
    setErro(null);
    setTipoCert("e-CNPJ A1");
    setDataEmissaoCert("");
    setDataVencimentoCert("");
    setValorCert("220");
    setSenhaCert("");
    setExtractState("idle");
  }

  async function handleFile(selected: File | null) {
    setFile(selected);
    if (!selected || !ehCertificado) {
      setExtractState("idle");
      return;
    }
    const name = selected.name.toLowerCase();
    const isPfx = name.endsWith(".pfx") || name.endsWith(".p12");
    const isPdf = selected.type === "application/pdf" || name.endsWith(".pdf");
    if (!isPfx && !isPdf) {
      setExtractState("unsupported");
      return;
    }
    setExtractState("extracting");
    try {
      const { dataEmissao: emissao, dataVencimento: vencimento } = isPfx
        ? await extractPfxDates(selected)
        : extractDocumentDates(await extractPdfText(selected));
      if (emissao) setDataEmissaoCert(emissao);
      if (vencimento) setDataVencimentoCert(vencimento);
      setExtractState(emissao || vencimento ? "found" : "not-found");
    } catch {
      setExtractState("error");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const targetCliente = effectiveClienteId;
    if (!file || !targetCliente || !cliente) return;
    if (ehCertificado && !dataVencimentoCert) return;

    setEnviando(true);
    setErro(null);
    try {
      const documento = await uploadDocumento({
        file,
        clienteId: targetCliente,
        clienteNome: cliente.dados.nomeFantasia ?? cliente.dados.razaoSocial,
        categoria,
        responsavelId: userId ?? undefined,
      });
      addDocumento(documento);

      if (ehCertificado) {
        addCertificado({
          id: `cert-${Date.now()}`,
          clienteId: targetCliente,
          documento: cliente.dados.cnpj,
          tipo: tipoCert,
          dataEmissao: dataEmissaoCert || undefined,
          dataVencimento: dataVencimentoCert,
          status: statusAutomaticoCertificado(dataVencimentoCert),
          valor: Number(valorCert) || 0,
          senha: senhaCert || undefined,
          responsavelId: userId ?? "u7",
          documentoId: documento.id,
        });
      }

      reset();
      onOpenChange(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar o arquivo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-4 text-wine-600" /> Anexar documento
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Arquivo</Label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sand-300 bg-sand-50 px-4 py-6 text-center hover:border-wine-400 hover:bg-wine-50">
              <FileUp className="size-5 text-wine-500" />
              <span className="text-xs font-medium text-sand-700">
                {file ? file.name : "Clique para selecionar um arquivo"}
              </span>
              {file && <span className="text-[11px] text-sand-400">{formatBytes(file.size)}</span>}
              <input
                type="file"
                className="hidden"
                required
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {ehCertificado && extractState === "extracting" && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-sand-500">
                <Loader2 className="size-3 animate-spin" /> Lendo o arquivo para identificar as datas...
              </p>
            )}
            {ehCertificado && extractState === "found" && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-status-success">
                <Sparkles className="size-3" /> Datas preenchidas automaticamente — confira antes de salvar.
              </p>
            )}
            {ehCertificado && extractState === "not-found" && (
              <p className="mt-1.5 text-[11px] text-sand-500">Não encontramos as datas no arquivo. Preencha manualmente.</p>
            )}
            {ehCertificado && extractState === "unsupported" && (
              <p className="mt-1.5 text-[11px] text-sand-500">
                Extração automática funciona para .pfx/.p12 e PDF com texto (não fotos). Preencha as datas manualmente.
              </p>
            )}
            {ehCertificado && extractState === "error" && (
              <p className="mt-1.5 text-[11px] text-status-danger">Não foi possível ler este arquivo. Preencha as datas manualmente.</p>
            )}
          </div>

          {!fixedClienteId && (
            <div>
              <Label className="mb-1 block">Cliente</Label>
              <Select value={effectiveClienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.dados.nomeFantasia ?? c.dados.razaoSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!fixedCategoria && (
            <div>
              <Label className="mb-1 block">Categoria</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as DocumentoCategoria)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {ehCertificado && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-sand-200 bg-sand-50 p-3">
              <p className="col-span-2 text-[11px] text-sand-500">
                Categoria &quot;Certificados&quot; também cadastra o certificado digital — com vencimento rastreado e alerta — além de anexar o arquivo.
              </p>
              <div>
                <Label className="mb-1 block">Tipo</Label>
                <Select value={tipoCert} onValueChange={(v) => setTipoCert(v as Certificado["tipo"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_CERTIFICADO.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block">Valor (R$)</Label>
                <Input type="number" value={valorCert} onChange={(e) => setValorCert(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1 block">Emissão</Label>
                <Input type="date" value={dataEmissaoCert} onChange={(e) => setDataEmissaoCert(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1 block">Vencimento *</Label>
                <Input type="date" value={dataVencimentoCert} onChange={(e) => setDataVencimentoCert(e.target.value)} required />
              </div>
              <div className="col-span-2">
                <Label className="mb-1 block">Senha do certificado (A1)</Label>
                <Input
                  type="password"
                  value={senhaCert}
                  onChange={(e) => setSenhaCert(e.target.value)}
                  placeholder="Opcional"
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          {erro && <p className="text-xs text-status-danger">{erro}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Enviando..." : "Anexar documento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
