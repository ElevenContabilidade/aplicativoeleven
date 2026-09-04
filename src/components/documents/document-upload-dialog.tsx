"use client";

import { useState } from "react";
import { Upload, FileUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { uploadDocumento } from "@/lib/upload-documento";
import type { DocumentoCategoria } from "@/lib/types";
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
  "Outros",
];

export function DocumentUploadDialog({
  open,
  onOpenChange,
  fixedClienteId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** When set, the dialog is scoped to this client and skips the client picker. */
  fixedClienteId?: string;
}) {
  const clients = useAppStore((s) => s.clients);
  const addDocumento = useAppStore((s) => s.addDocumento);
  const { userId } = useAuthStore();

  const [file, setFile] = useState<File | null>(null);
  const [clienteId, setClienteId] = useState(fixedClienteId ?? clients[0]?.id ?? "");
  const [categoria, setCategoria] = useState<DocumentoCategoria>("Outros");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function reset() {
    setFile(null);
    setCategoria("Outros");
    setErro(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const targetCliente = fixedClienteId ?? clienteId;
    if (!file || !targetCliente) return;
    const cliente = clients.find((c) => c.id === targetCliente);
    if (!cliente) return;

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
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {!fixedClienteId && (
            <div>
              <Label className="mb-1 block">Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
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
