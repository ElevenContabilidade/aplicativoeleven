"use client";

import { useState } from "react";
import { FileSpreadsheet, UploadCloud, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { lerPlanilhaClientes, clienteDeLinha, type LinhaClienteImportada } from "@/lib/import-clientes";

export function ImportarClientesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addClient = useAppStore((s) => s.addClient);
  const { userId } = useAuthStore();

  const [linhas, setLinhas] = useState<LinhaClienteImportada[] | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [lendo, setLendo] = useState(false);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);
  const [importados, setImportados] = useState<number | null>(null);

  function reset() {
    setLinhas(null);
    setNomeArquivo("");
    setErroArquivo(null);
    setImportados(null);
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    setNomeArquivo(file.name);
    setErroArquivo(null);
    setImportados(null);
    setLendo(true);
    try {
      const resultado = await lerPlanilhaClientes(file);
      if (resultado.length === 0) {
        setErroArquivo("Não encontramos nenhuma linha de cliente nesse arquivo.");
        setLinhas(null);
      } else {
        setLinhas(resultado);
      }
    } catch {
      setErroArquivo("Não foi possível ler esse arquivo. Confira se é um .csv ou .xlsx válido.");
      setLinhas(null);
    } finally {
      setLendo(false);
    }
  }

  const validas = linhas?.filter((l) => !l.erro) ?? [];
  const comErro = linhas?.filter((l) => l.erro) ?? [];

  async function handleImportar() {
    if (validas.length === 0) return;
    setImportando(true);
    for (const linha of validas) {
      addClient(clienteDeLinha(linha, userId ?? undefined));
    }
    setImportando(false);
    setImportados(validas.length);
    setLinhas(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar clientes por planilha</DialogTitle>
        </DialogHeader>

        {importados !== null ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 className="size-8 text-status-success" />
            <p className="text-sm font-medium text-sand-800">
              {importados} cliente{importados === 1 ? "" : "s"} importado{importados === 1 ? "" : "s"} com sucesso.
            </p>
            <p className="text-xs text-sand-500">Complete os dados que faltam (CNPJ, sócios, contrato) no cadastro de cada um.</p>
          </div>
        ) : !linhas ? (
          <div className="space-y-3">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sand-300 bg-sand-50 px-4 py-8 text-center hover:border-wine-400 hover:bg-wine-50">
              <UploadCloud className="size-6 text-wine-500" />
              <span className="text-sm font-medium text-sand-700">
                {lendo ? "Lendo arquivo..." : nomeArquivo || "Clique para escolher o arquivo (.csv, .xlsx ou .xls)"}
              </span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                disabled={lendo}
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {erroArquivo && (
              <p className="flex items-center gap-1.5 text-xs text-status-danger">
                <AlertTriangle className="size-3.5" /> {erroArquivo}
              </p>
            )}
            <div className="rounded-lg border border-sand-200 bg-sand-50 p-3 text-[11px] text-sand-500">
              <p className="mb-1 flex items-center gap-1.5 font-medium text-sand-700">
                <FileSpreadsheet className="size-3.5" /> Colunas reconhecidas (não precisa ter todas, nem nessa ordem)
              </p>
              <p>
                CNPJ, Razão social, Nome fantasia, Segmento, Regime tributário, Mensalidade, Status, Município, Estado,
                Início do contrato, Telefone, E-mail.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-medium text-sand-700">{validas.length} pronto{validas.length === 1 ? "" : "s"} para importar</span>
              {comErro.length > 0 && (
                <span className="flex items-center gap-1 text-status-danger">
                  <AlertTriangle className="size-3.5" /> {comErro.length} linha{comErro.length === 1 ? "" : "s"} sem razão social/nome — não {comErro.length === 1 ? "será importada" : "serão importadas"}
                </span>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto rounded-lg border border-sand-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Linha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Regime</TableHead>
                    <TableHead>Mensalidade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((l) => (
                    <TableRow key={l.linha} className={l.erro ? "bg-status-danger-bg/40" : undefined}>
                      <TableCell className="text-sand-400">{l.linha}</TableCell>
                      <TableCell>
                        {l.erro ? <span className="text-status-danger">{l.erro}</span> : (l.nomeFantasia || l.razaoSocial)}
                      </TableCell>
                      <TableCell>{l.cnpj || "—"}</TableCell>
                      <TableCell>{l.regimeTributario}</TableCell>
                      <TableCell>{l.valorMensal ? l.valorMensal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}</TableCell>
                      <TableCell>{l.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          {linhas && importados === null && (
            <Button type="button" variant="outline" onClick={() => setLinhas(null)}>
              Escolher outro arquivo
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {importados !== null ? "Fechar" : "Cancelar"}
          </Button>
          {linhas && importados === null && (
            <Button type="button" onClick={handleImportar} disabled={validas.length === 0 || importando}>
              {importando ? "Importando..." : `Importar ${validas.length} cliente${validas.length === 1 ? "" : "s"}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
