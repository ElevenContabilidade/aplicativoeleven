"use client";

import { useState } from "react";
import { FileUp, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { LICENCA_STATUS, type Licenca, type LicencaStatus } from "@/lib/types";
import { extractPdfText } from "@/lib/pdf-text";
import { extractLicenseDates } from "@/lib/license-date-extract";
import { formatBytes } from "@/lib/utils";

type ExtractState = "idle" | "extracting" | "found" | "not-found" | "unsupported" | "error";

export function LicencaFormDialog({
  open,
  onOpenChange,
  clienteId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clienteId: string;
}) {
  const addLicenca = useAppStore((s) => s.addLicenca);
  const addDocumento = useAppStore((s) => s.addDocumento);
  const { userId } = useAuthStore();

  const [nome, setNome] = useState("");
  const [status, setStatus] = useState<LicencaStatus>("Regular");
  const [dataEmissao, setDataEmissao] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [observacao, setObservacao] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [extractState, setExtractState] = useState<ExtractState>("idle");

  function reset() {
    setNome(""); setStatus("Regular"); setDataEmissao(""); setDataVencimento(""); setObservacao("");
    setFile(null); setExtractState("idle");
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
      const { dataEmissao: emissao, dataVencimento: vencimento } = extractLicenseDates(text);
      if (emissao) setDataEmissao(emissao);
      if (vencimento) setDataVencimento(vencimento);
      setExtractState(emissao || vencimento ? "found" : "not-found");
    } catch {
      setExtractState("error");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !dataVencimento) return;

    let documentoId: string | undefined;
    if (file) {
      documentoId = `d-${Date.now()}`;
      addDocumento({
        id: documentoId,
        clienteId,
        nome: file.name,
        categoria: "Licenças",
        dataArquivo: new Date().toISOString().slice(0, 10),
        responsavelId: userId ?? "u1",
        tamanho: formatBytes(file.size),
        url: URL.createObjectURL(file),
      });
    }

    const licenca: Licenca = {
      id: `lic-${Date.now()}`,
      clienteId,
      nome,
      status,
      dataEmissao: dataEmissao || undefined,
      dataVencimento,
      documentoId,
      observacao: observacao || undefined,
    };
    addLicenca(licenca);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova licença ou registro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Arquivo (opcional)</Label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sand-300 bg-sand-50 px-4 py-5 text-center hover:border-wine-400 hover:bg-wine-50">
              <FileUp className="size-5 text-wine-500" />
              <span className="text-xs font-medium text-sand-700">
                {file ? file.name : "Clique para anexar o PDF da licença"}
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
            <Label className="mb-1 block">Nome *</Label>
            <Input placeholder="Ex.: Alvará de Funcionamento" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Data de emissão</Label>
              <Input type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Data de vencimento *</Label>
              <Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} required />
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as LicencaStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LICENCA_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Observações</Label>
              <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} />
            </div>
          </div>
          <p className="text-[11px] text-sand-400">
            Você recebe um alerta na Central de Alertas quando faltar 1 mês para o vencimento.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Adicionar licença</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
