"use client";

import { useState } from "react";
import { ScrollText, Eye, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { GuiaFiscal } from "@/lib/types";
import { recalcularGuiaFiscal, type RecalculoGuia } from "@/lib/guia-fiscal-recalculo";
import { formatCurrency, formatDate } from "@/lib/utils";

const HOJE = new Date().toISOString().slice(0, 10);

/** Guias fiscais (DARF/GPS/DAS) do cliente — se estiver vencida e ainda não
 * paga, ele mesmo pode recalcular o valor atualizado com a multa de mora. */
export function GuiasFiscaisCard({ guias }: { guias: GuiaFiscal[] }) {
  const [recalculadas, setRecalculadas] = useState<Record<string, RecalculoGuia>>({});

  if (guias.length === 0) return null;

  const ordenadas = [...guias].sort((a, b) => b.vencimento.localeCompare(a.vencimento));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ScrollText className="size-4 text-wine-600" /> Guias fiscais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        {ordenadas.map((g) => {
          const recalculo = recalculadas[g.id];
          const atrasada = !g.paga && g.vencimento < HOJE;
          return (
            <div key={g.id} className="rounded-lg border border-sand-200 p-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-sand-800">{g.tipo} — {g.competencia}</p>
                  <p className="text-sand-500">
                    Vencimento: {formatDate(g.vencimento)} • Valor original: {formatCurrency(g.valorOriginal)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {g.arquivoUrl && (
                    <a
                      href={g.arquivoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-wine-700 hover:underline"
                    >
                      <Eye className="size-3.5" /> Ver guia
                    </a>
                  )}
                  {atrasada && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRecalculadas((r) => ({ ...r, [g.id]: recalcularGuiaFiscal(g.valorOriginal, g.vencimento) }))}
                    >
                      <Calculator className="size-3.5" /> Recalcular
                    </Button>
                  )}
                </div>
              </div>
              {g.paga && (
                <p className="mt-1 text-status-success">Paga{g.dataPagamento ? ` em ${formatDate(g.dataPagamento)}` : ""}.</p>
              )}
              {recalculo && (
                <p className="mt-2 rounded-md bg-status-warning-bg px-2 py-1.5 text-status-warning">
                  {recalculo.diasAtraso} dia{recalculo.diasAtraso === 1 ? "" : "s"} de atraso — multa de mora de{" "}
                  {recalculo.percentualMulta.toFixed(2)}% ({formatCurrency(recalculo.valorMulta)}). Valor atualizado:{" "}
                  <strong>{formatCurrency(recalculo.valorAtualizado)}</strong>.
                </p>
              )}
            </div>
          );
        })}
        <p className="text-[11px] text-sand-400">
          O recálculo é uma estimativa (multa de mora de 0,33% ao dia, até 20%) — não substitui a guia oficial atualizada, que
          deve ser emitida pela sua contabilidade.
        </p>
      </CardContent>
    </Card>
  );
}
