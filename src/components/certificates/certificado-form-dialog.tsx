"use client";

import { useState } from "react";
import { FileUp, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import type { Certificado, CertificadoStatus } from "@/lib/types";
import { extractPdfText } from "@/lib/pdf-text";
import { extractDocumentDates } from "@/lib/document-date-extract";
import { formatBytes } from "@/lib/utils";

const TIPOS: Certificado["tipo"][] = ["e-CPF A1", "e-CNPJ A1", "e-CPF A3", "e-CNPJ A3"];
const STATUSES: CertificadoStatus[] = [
  "Agendamento solicitado",
  "Agendamento realizado",
  "Aguardando validação",
  "Validado",
  "Certificado aprovado",
  "Entregue",
  "Renovação próxima",
  "Vencido",
];

type ExtractState = "idle" | "extracting" | "found" | "not-found" | "unsupported" | "error";

export function CertificadoFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const clients = useAppStore((s) => s.clients);
  const addCertificado = useAppStore((s) => s.addCertificado);
  const addDocumento = useAppStore((s) => s.addDocumento);
  const { userId } = useAuthStore();

  const [clienteId, setClienteId] = useState(clients[0]?.id ?? "");
  const [tipo, setTipo] = useState<Certificado["tipo"]>("e-CNPJ A1");
  const [documento, setDocumento] = useState("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [valor, setValor] = useState("220");
  const [status, setStatus] = useState<CertificadoStatus>("Agendamento solicitado");
  const [file, setFile] = useState<File | null>(null);
  const [extractState, setExtractState] = useState<ExtractState>("idle");

  function reset() {
    setTipo("e-CNPJ A1"); setDocumento(""); setDataEmissao(""); setDataVencimento(""); setValor("220");
    setStatus("Agendamento solicitado"); setFile(null); setExtractState("idle");
  }

  async function handleFile(selected: File | null) {
    setFile(selected);
    if (!selected) {
      setExtractState("idle");
      return;
    }
    if (selected.type !== "application/pdf") {
      setExtractState("unsupported");
      return;
    }
    setExtractState("extracting");
    try {
      const text = await extractPdfText(selected);
      const { dataEmissao: emissao, dataVencimento: vencimento } = extractDocumentDates(text);
      if (emissao) setDataEmissao(emissao);
      if (vencimento) setDataVencimento(vencimento);
      setExtractState(emissao || vencimento ? "found" : "not-found");
    } catch {
      setExtractState("error");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId || !documento || !dataVencimento) return;

    let documentoId: string | undefined;
    if (file) {
      documentoId = `d-${Date.now()}`;
      addDocumento({
        id: documentoId,
        clienteId,
        nome: file.name,
        categoria: "Certificados",
        dataArquivo: new Date().toISOString().slice(0, 10),
        responsavelId: userId ?? "u7",
        tamanho: formatBytes(file.size),
        url: URL.createObjectURL(file),
      });
    }

    const certificado: Certificado = {
      id: `cert-${Date.now()}`,
      clienteId,
      documento,
      tipo,
      dataEmissao: dataEmissao || undefined,
      dataVencimento,
      status,
      valor: Number(valor) || 0,
      responsavelId: userId ?? "u7",
      documentoId,
    };
    addCertificado(certificado);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo certificado digital</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Arquivo do certificado (opcional)</Label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sand-300 bg-sand-50 px-4 py-5 text-center hover:border-wine-400 hover:bg-wine-50">
              <FileUp className="size-5 text-wine-500" />
              <span className="text-xs font-medium text-sand-700">
                {file ? file.name : "Clique para anexar o certificado (PDF)"}
              </span>
              {file && <span className="text-[11px] text-sand-400">{formatBytes(file.size)}</span>}
              <input
                type="file"
                accept=".pdf,image/*"
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
                Não encontramos as datas no texto do PDF. Preencha manualmente.
              </p>
            )}
            {extractState === "unsupported" && (
              <p className="mt-1.5 text-[11px] text-sand-500">
                Extração automática funciona só para PDF com texto (não fotos). Preencha as datas manualmente.
              </p>
            )}
            {extractState === "error" && (
              <p className="mt-1.5 text-[11px] text-status-danger">
                Não foi possível ler este PDF. Preencha as datas manualmente.
              </p>
            )}
          </div>
          <div>
            <Label className="mb-1 block">Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.dados.nomeFantasia ?? c.dados.razaoSocial}</SelectItem>
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
                  {STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-[11px] text-sand-400">
            Você recebe um alerta na Central de Alertas quando faltar 1 mês para o vencimento.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Cadastrar certificado</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
