"use client";

import { useMemo, useState } from "react";
import { Check, Eye, FileUp, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";
import { uploadDocumento } from "@/lib/upload-documento";
import type { StatusEnvioMensal } from "@/lib/types";
import { cn } from "@/lib/utils";

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez",
];

const HOJE = new Date().toISOString().slice(0, 7);

const STATUS_STYLE: Record<StatusEnvioMensal, string> = {
  Pendente: "border-status-danger bg-status-danger-bg text-status-danger",
  "Em andamento": "border-status-warning bg-status-warning-bg text-status-warning",
  Concluído: "border-status-success bg-status-success-bg text-status-success",
  "Nada a enviar": "border-sand-300 bg-sand-100 text-sand-500",
};

export function ChecklistMensalCard({ clienteId, clienteNome }: { clienteId: string; clienteNome: string }) {
  const todosTipos = useAppStore((s) => s.tiposDocumentoRecorrente);
  const todosEnvios = useAppStore((s) => s.enviosMensaisDocumento);
  const tipos = todosTipos.filter((t) => t.clienteId === clienteId && t.ativo);
  const envios = todosEnvios.filter((e) => e.clienteId === clienteId);
  const documentos = useAppStore((s) => s.documentos);
  const setEnvioMensal = useAppStore((s) => s.setEnvioMensal);
  const addDocumento = useAppStore((s) => s.addDocumento);

  const anoAtual = Number(HOJE.slice(0, 4));
  const [competenciaSelecionada, setCompetenciaSelecionada] = useState(HOJE);
  const [enviandoTipoId, setEnviandoTipoId] = useState<string | null>(null);

  function statusDe(tipoId: string, competencia: string): StatusEnvioMensal {
    return envios.find((e) => e.tipoId === tipoId && e.competencia === competencia)?.status ?? "Pendente";
  }

  function documentoDe(tipoId: string, competencia: string) {
    const id = envios.find((e) => e.tipoId === tipoId && e.competencia === competencia)?.documentoId;
    return id ? documentos.find((d) => d.id === id) : undefined;
  }

  function pendentesEm(competencia: string) {
    return tipos.filter((t) => {
      const s = statusDe(t.id, competencia);
      return s === "Pendente" || s === "Em andamento";
    }).length;
  }

  const anos = [anoAtual - 1, anoAtual];

  async function enviarArquivo(tipoId: string, competencia: string, file: File) {
    setEnviandoTipoId(tipoId);
    try {
      const documento = await uploadDocumento({ file, clienteId, clienteNome, categoria: "Outros" });
      addDocumento(documento);
      setEnvioMensal(clienteId, tipoId, competencia, "Concluído", documento.id);
    } catch {
      // silencioso — o card de "Enviar documentos" acima já cobre esse caso de erro
    } finally {
      setEnviandoTipoId(null);
    }
  }

  function concluirTodos() {
    for (const t of tipos) {
      if (statusDe(t.id, competenciaSelecionada) === "Pendente") {
        setEnvioMensal(clienteId, t.id, competenciaSelecionada, "Nada a enviar");
      }
    }
  }

  const [anoSel, mesSel] = competenciaSelecionada.split("-");
  const mesLabel = useMemo(() => {
    const nomes = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    return nomes[Number(mesSel) - 1];
  }, [mesSel]);

  if (tipos.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="size-4 text-wine-600" /> Documentos a enviar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center gap-4 text-[11px] text-sand-500">
          <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-status-danger" /> Pendente</span>
          <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-status-warning" /> Em andamento</span>
          <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-status-success" /> Concluído</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th className="w-14" />
                {MESES.map((m) => (
                  <th key={m} className="pb-1 text-center font-medium text-sand-500">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {anos.map((ano) => (
                <tr key={ano}>
                  <td className="pr-2 text-right font-semibold text-sand-700">{ano}</td>
                  {MESES.map((_, i) => {
                    const competencia = `${ano}-${String(i + 1).padStart(2, "0")}`;
                    const futura = competencia > HOJE;
                    const pendentes = pendentesEm(competencia);
                    const selecionada = competencia === competenciaSelecionada;
                    return (
                      <td key={competencia} className="text-center">
                        {futura ? (
                          <span className="inline-flex size-7 items-center justify-center text-sand-300">—</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCompetenciaSelecionada(competencia)}
                            className={cn(
                              "inline-flex size-7 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                              pendentes === 0 ? "bg-status-success text-white" : "bg-status-danger text-white",
                              selecionada && "ring-2 ring-wine-500 ring-offset-1"
                            )}
                            title={pendentes === 0 ? "Tudo em dia" : `${pendentes} pendente(s)`}
                          >
                            {pendentes === 0 ? <Check className="size-3.5" /> : pendentes}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-sand-200">
          <div className="flex items-center justify-between border-b border-sand-200 bg-sand-50 px-3 py-2">
            <p className="text-xs font-semibold text-sand-800">{mesLabel} / {anoSel}</p>
            {pendentesEm(competenciaSelecionada) > 0 && (
              <Button size="sm" variant="outline" onClick={concluirTodos}>
                <Check className="size-3.5" /> Concluir todos
              </Button>
            )}
          </div>
          <div className="divide-y divide-sand-100">
            {tipos.map((t) => {
              const status = statusDe(t.id, competenciaSelecionada);
              const doc = documentoDe(t.id, competenciaSelecionada);
              const enviandoEsse = enviandoTipoId === t.id;
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs">
                  <span className="min-w-0 truncate font-medium text-sand-800">{t.nome}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    {doc?.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-wine-700 hover:underline">
                        <Eye className="size-3.5" /> Ver
                      </a>
                    )}
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", STATUS_STYLE[status])}>
                      {status}
                    </span>
                    {status === "Pendente" && (
                      <>
                        <label className="flex cursor-pointer items-center gap-1 text-wine-700 hover:underline">
                          <FileUp className="size-3.5" /> {enviandoEsse ? "Enviando..." : "+ Adicionar"}
                          <input
                            type="file"
                            className="hidden"
                            disabled={enviandoEsse}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void enviarArquivo(t.id, competenciaSelecionada, file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setEnvioMensal(clienteId, t.id, competenciaSelecionada, "Nada a enviar")}
                          className="text-sand-500 hover:underline"
                        >
                          Nada a enviar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
