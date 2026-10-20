"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ETAPAS_CONDUCAO_PADRAO, MENSAGENS_CONDUCAO_PADRAO, type EtapaConducaoLead } from "@/lib/types";

/** Checklist de follow-up padrão de um lead novo — Segundo contato, Terceiro
 * contato e Encerramento, cada um já com a mensagem sugerida pronta. */
export function conducaoPadrao(): EtapaConducaoLead[] {
  return ETAPAS_CONDUCAO_PADRAO.map((nome, i) => ({
    id: `cond-${Date.now()}-${i}`,
    nome,
    concluido: false,
    mensagem: MENSAGENS_CONDUCAO_PADRAO[nome],
  }));
}

export function ConducaoChecklist({
  etapas,
  nomeLead,
  onChange,
}: {
  etapas: EtapaConducaoLead[];
  nomeLead: string;
  onChange: (etapas: EtapaConducaoLead[]) => void;
}) {
  const [abertaId, setAbertaId] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  function atualizar(id: string, patch: Partial<EtapaConducaoLead>) {
    onChange(etapas.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  async function copiar(etapa: EtapaConducaoLead) {
    const texto = (etapa.mensagem ?? "").replace(/\[nome\]/gi, nomeLead || "[nome]");
    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoId(etapa.id);
      setTimeout(() => setCopiadoId((cur) => (cur === etapa.id ? null : cur)), 2000);
    } catch {
      // clipboard indisponível (ex: sem permissão do navegador) — a mensagem
      // já fica visível no campo pra copiar manualmente.
    }
  }

  return (
    <div className="space-y-2">
      {etapas.map((etapa) => {
        const aberta = abertaId === etapa.id;
        const mensagemPadrao = MENSAGENS_CONDUCAO_PADRAO[etapa.nome as keyof typeof MENSAGENS_CONDUCAO_PADRAO];
        return (
          <div key={etapa.id} className="rounded-lg border border-sand-200">
            <div className="flex items-center gap-2 px-3 py-2">
              <Checkbox checked={etapa.concluido} onCheckedChange={(v) => atualizar(etapa.id, { concluido: v === true })} />
              <button
                type="button"
                onClick={() => setAbertaId(aberta ? null : etapa.id)}
                className="flex flex-1 items-center justify-between gap-2 text-left text-xs font-medium text-sand-800"
              >
                {etapa.nome}
                {aberta ? <ChevronDown className="size-3.5 text-sand-400" /> : <ChevronRight className="size-3.5 text-sand-400" />}
              </button>
              <Input
                type="date"
                value={etapa.data ?? ""}
                onChange={(e) => atualizar(etapa.id, { data: e.target.value || undefined })}
                className="h-8 w-36 text-xs"
              />
            </div>
            {aberta && (
              <div className="space-y-2 border-t border-sand-100 px-3 py-2">
                <Textarea value={etapa.mensagem ?? ""} onChange={(e) => atualizar(etapa.id, { mensagem: e.target.value })} rows={4} className="text-xs" />
                <div className="flex items-center gap-3">
                  <Button type="button" size="sm" variant="outline" onClick={() => copiar(etapa)}>
                    {copiadoId === etapa.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copiadoId === etapa.id ? "Copiado!" : "Copiar mensagem"}
                  </Button>
                  {mensagemPadrao && (
                    <button
                      type="button"
                      onClick={() => atualizar(etapa.id, { mensagem: mensagemPadrao })}
                      className="text-[11px] text-sand-500 hover:text-wine-700 hover:underline"
                    >
                      Restaurar mensagem padrão
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
