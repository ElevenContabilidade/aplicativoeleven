"use client";

import { useState } from "react";
import { Eye, EyeOff, FileUp, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { uploadDocumento } from "@/lib/upload-documento";
import { CERTIFICADO_STATUS, type Certificado, type CertificadoStatus } from "@/lib/types";
import { extractPdfText } from "@/lib/pdf-text";
import { extractDocumentDates } from "@/lib/document-date-extract";
import { extractPfxDates } from "@/lib/pfx-dates";
import { formatBytes } from "@/lib/utils";

const TIPOS: Certificado["tipo"][] = ["e-CPF A1", "e-CNPJ A1", "e-CPF A3", "e-CNPJ A3"];

type ExtractState = "idle" | "extracting" | "found" | "not-found" | "unsupported" | "error";

export function CertificadoFormDialog({
  open,
  onOpenChange,
  certificado,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** When set, the dialog edits this certificado instead of creating a new one. */
  certificado?: Certificado | null;
}) {
  const clients = useAppStore((s) => s.clients);
  const addCertificado = useAppStore((s) => s.addCertificado);
  const updateCertificado = useAppStore((s) => s.updateCertificado);
  const addDocumento = useAppStore((s) => s.addDocumento);
  const { userId } = useAuthStore();

  // The parent remounts this component (via a `key` tied to the certificado's id,
  // or a fresh id for "create new") whenever it should show a different record, so
  // plain useState initializers are enough — no effect needed to resync on open.
  const [clienteId, setClienteId] = useState(certificado?.clienteId ?? clients[0]?.id ?? "");
  const [tipo, setTipo] = useState<Certificado["tipo"]>(certificado?.tipo ?? "e-CNPJ A1");
  const [documento, setDocumento] = useState(certificado?.documento ?? "");
  const [dataEmissao, setDataEmissao] = useState(certificado?.dataEmissao ?? "");
  const [dataVencimento, setDataVencimento] = useState(certificado?.dataVencimento ?? "");
  const [valor, setValor] = useState(String(certificado?.valor ?? 220));
  const [status, setStatus] = useState<CertificadoStatus>(certificado?.status ?? "Aguardando Renovação");
  const [senha, setSenha] = useState(certificado?.senha ?? "");
  const [showSenha, setShowSenha] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [extractState, setExtractState] = useState<ExtractState>("idle");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function handleClienteChange(id: string) {
    setClienteId(id);
    const client = clients.find((c) => c.id === id);
    if (client?.dados.cnpj) setDocumento(client.dados.cnpj);
  }

  async function handleFile(selected: File | null) {
    setFile(selected);
    if (!selected) {
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
      if (emissao) setDataEmissao(emissao);
      if (vencimento) setDataVencimento(vencimento);
      setExtractState(emissao || vencimento ? "found" : "not-found");
    } catch {
      setExtractState("error");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId || !documento || !dataVencimento) return;
    const cliente = clients.find((c) => c.id === clienteId);

    setSalvando(true);
    setErro(null);
    try {
      let documentoId: string | undefined = certificado?.documentoId;
      if (file && cliente) {
        const doc = await uploadDocumento({
          file,
          clienteId,
          clienteNome: cliente.dados.nomeFantasia ?? cliente.dados.razaoSocial,
          categoria: "Certificados",
          responsavelId: userId ?? undefined,
        });
        documentoId = doc.id;
        addDocumento(doc);
      }

      const patch = {
        clienteId,
        documento,
        tipo,
        dataEmissao: dataEmissao || undefined,
        dataVencimento,
        status,
        valor: Number(valor) || 0,
        senha: senha || undefined,
        documentoId,
      };

      if (certificado) {
        updateCertificado(certificado.id, patch);
      } else {
        addCertificado({ id: `cert-${Date.now()}`, responsavelId: userId ?? "u7", ...patch });
      }
      onOpenChange(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar o arquivo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{certificado ? "Editar certificado digital" : "Novo certificado digital"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Arquivo do certificado (opcional)</Label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sand-300 bg-sand-50 px-4 py-5 text-center hover:border-wine-400 hover:bg-wine-50">
              <FileUp className="size-5 text-wine-500" />
              <span className="text-xs font-medium text-sand-700">
                {file ? file.name : "Clique para anexar o certificado (.pfx/.p12 ou PDF)"}
              </span>
              {file && <span className="text-[11px] text-sand-400">{formatBytes(file.size)}</span>}
              <input
                type="file"
                accept=".pfx,.p12,.pdf,image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {extractState === "extracting" && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-sand-500">
                <Loader2 className="size-3 animate-spin" /> Lendo o arquivo para identificar as datas...
              </p>
            )}
            {extractState === "found" && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-status-success">
                <Sparkles className="size-3" /> Datas preenchidas automaticamente — confira antes de salvar.
              </p>
            )}
            {extractState === "not-found" && (
              <p className="mt-1.5 text-[11px] text-sand-500">
                Não encontramos as datas no arquivo. Preencha manualmente.
              </p>
            )}
            {extractState === "unsupported" && (
              <p className="mt-1.5 text-[11px] text-sand-500">
                Extração automática funciona para .pfx/.p12 e PDF com texto (não fotos). Preencha as datas manualmente.
              </p>
            )}
            {extractState === "error" && (
              <p className="mt-1.5 text-[11px] text-status-danger">
                Não foi possível ler este arquivo. Preencha as datas manualmente.
              </p>
            )}
          </div>
          <div>
            <Label className="mb-1 block">Cliente</Label>
            <Select value={clienteId} onValueChange={handleClienteChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.dados.razaoSocial}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as Certificado["tipo"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">CPF/CNPJ *</Label>
              <Input value={documento} onChange={(e) => setDocumento(e.target.value)} required />
            </div>
            <div>
              <Label className="mb-1 block">Emissão</Label>
              <Input type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Vencimento *</Label>
              <Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} required />
            </div>
            <div>
              <Label className="mb-1 block">Valor (R$)</Label>
              <Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as CertificadoStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CERTIFICADO_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Senha do certificado (A1)</Label>
              <div className="relative">
                <Input
                  type={showSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Opcional — fica disponível para consulta na listagem"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600"
                  tabIndex={-1}
                >
                  {showSenha ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-sand-400">
            Você recebe um alerta na Central de Alertas quando faltar 1 mês para o vencimento.
          </p>
          {erro && <p className="text-xs text-status-danger">{erro}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : certificado ? "Salvar alterações" : "Cadastrar certificado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
