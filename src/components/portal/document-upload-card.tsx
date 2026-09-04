"use client";

import { useState } from "react";
import { FileUp, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { uploadDocumento } from "@/lib/upload-documento";
import type { DocumentoCategoria } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

const CATEGORIAS_CLIENTE: { value: DocumentoCategoria; label: string }[] = [
  { value: "Notas fiscais", label: "Nota fiscal (NFe/NFSe)" },
  { value: "Extratos bancários", label: "Extrato bancário" },
  { value: "Comprovantes", label: "Comprovante de pagamento" },
  { value: "Boletos", label: "Boleto" },
  { value: "Folha", label: "Documento de folha / DP" },
  { value: "Outros", label: "Outro" },
];

/** Upload de documentos do Portal do Cliente — Bloco 1 da spec do app do
 * cliente. Vários arquivos de uma vez, categorização simples, sobe pro
 * Drive do escritório igual ao fluxo interno da equipe. */
export function DocumentUploadCard({ clienteId, clienteNome }: { clienteId: string; clienteNome: string }) {
  const addDocumento = useAppStore((s) => s.addDocumento);
  const [files, setFiles] = useState<File[]>([]);
  const [categoria, setCategoria] = useState<DocumentoCategoria>("Notas fiscais");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviados, setEnviados] = useState(0);
  const [total, setTotal] = useState(0);
  const [concluido, setConcluido] = useState<number | null>(null);

  function addFiles(selected: FileList | null) {
    if (!selected) return;
    setFiles((cur) => [...cur, ...Array.from(selected)]);
  }

  function removeFile(idx: number) {
    setFiles((cur) => cur.filter((_, i) => i !== idx));
  }

  async function enviar() {
    if (files.length === 0) return;
    const lote = files;
    setEnviando(true);
    setErro(null);
    setConcluido(null);
    setEnviados(0);
    setTotal(lote.length);
    try {
      for (const file of lote) {
        const documento = await uploadDocumento({ file, clienteId, clienteNome, categoria });
        addDocumento(documento);
        setEnviados((n) => n + 1);
      }
      setFiles([]);
      setConcluido(lote.length);
      setTimeout(() => setConcluido(null), 3000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar o arquivo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="size-4 text-wine-600" /> Enviar documentos
        </CardTitle>
        <p className="mt-1 text-xs text-sand-500">
          Notas fiscais, extratos, comprovantes e boletos — envie direto pra sua contabilidade, sem precisar mandar por WhatsApp.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div>
          <Select value={categoria} onValueChange={(v) => setCategoria(v as DocumentoCategoria)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIAS_CLIENTE.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sand-300 bg-sand-50 px-4 py-5 text-center hover:border-wine-400 hover:bg-wine-50">
          <FileUp className="size-5 text-wine-500" />
          <span className="text-xs font-medium text-sand-700">Clique para selecionar (pode escolher vários arquivos)</span>
          <input type="file" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        </label>

        {files.length > 0 && (
          <div className="space-y-1.5">
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2 text-xs">
                <span className="min-w-0 truncate text-sand-800">{f.name}</span>
                <div className="flex shrink-0 items-center gap-2 text-sand-400">
                  <span>{formatBytes(f.size)}</span>
                  <button type="button" onClick={() => removeFile(i)} className="hover:text-status-danger">
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {erro && <p className="text-xs text-status-danger">{erro}</p>}
        {concluido !== null && (
          <p className="flex items-center gap-1.5 text-xs text-status-success">
            <Check className="size-3.5" /> {concluido} arquivo(s) enviado(s) com sucesso.
          </p>
        )}

        <Button type="button" size="sm" disabled={files.length === 0 || enviando} onClick={enviar}>
          {enviando ? `Enviando ${enviados}/${total}...` : `Enviar${files.length ? ` (${files.length})` : ""}`}
        </Button>
      </CardContent>
    </Card>
  );
}
