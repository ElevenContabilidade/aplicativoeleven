"use client";

import { useState } from "react";
import { Ban, Check, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import {
  REGRAS_VENCIMENTO_ROTINA_PADRAO,
  isRotinaDesativadaNoSetor,
  type AjusteVencimento,
  type RegraVencimento,
  type SetorRotina,
} from "@/lib/obrigacoes-departamentos";
import { ROTINAS_FISCAIS_MENSAIS, ROTINAS_CONTABEIS_MENSAIS, ROTINAS_PESSOAL_FIXAS, ROTINAS_PESSOAL_VARIAVEIS, ROTINAS_MEI } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATALOGO_POR_SETOR: Record<SetorRotina, readonly string[]> = {
  Fiscal: ROTINAS_FISCAIS_MENSAIS,
  Contábil: ROTINAS_CONTABEIS_MENSAIS,
  "Departamento Pessoal": [...ROTINAS_PESSOAL_FIXAS, ...ROTINAS_PESSOAL_VARIAVEIS],
  MEI: ROTINAS_MEI,
};

const AJUSTES: { value: AjusteVencimento; label: string }[] = [
  { value: "antecipa", label: "Antecipa" },
  { value: "prorroga", label: "Prorroga" },
  { value: "nenhum", label: "Dia fixo" },
];

/** Aba de configuração do Obrigações: regras de vencimento de cada rotina
 * (editáveis por cima do padrão de fábrica) e quais rotinas cada setor
 * cobra (pode desativar uma pro setor inteiro). Ainda não existe "Modelos
 * de processo" — isso aqui é só sobre as rotinas já cadastradas. */
export function ObrigacoesConfiguracoes() {
  const regrasVencimentoOverride = useAppStore((s) => s.regrasVencimentoOverride);
  const updateRegrasVencimentoOverride = useAppStore((s) => s.updateRegrasVencimentoOverride);
  const rotinasDesativadas = useAppStore((s) => s.rotinasDesativadas);
  const addRotinaDesativada = useAppStore((s) => s.addRotinaDesativada);
  const deleteRotinaDesativada = useAppStore((s) => s.deleteRotinaDesativada);

  const todasAsRotinas = [...new Set(Object.values(CATALOGO_POR_SETOR).flat())].sort((a, b) => a.localeCompare(b, "pt-BR"));

  // Só guarda o que foi de fato mexido nessa sessão (rascunho esparso) —
  // o que não está aqui continua refletindo o valor salvo ao vivo, sem
  // precisar sincronizar uma cópia inteira via efeito. `null` marca "clique
  // em remover", diferente de undefined (nunca mexeu).
  const [rascunho, setRascunho] = useState<Record<string, RegraVencimento | null>>({});
  const [salvo, setSalvo] = useState(false);

  function valorAtual(rotina: string): RegraVencimento | undefined {
    if (rotina in rascunho) return rascunho[rotina] ?? undefined;
    return regrasVencimentoOverride[rotina] ?? REGRAS_VENCIMENTO_ROTINA_PADRAO[rotina];
  }

  function mudarRegra(rotina: string, patch: Partial<RegraVencimento>) {
    const atual = valorAtual(rotina) ?? { dia: 10, ajuste: "nenhum" as AjusteVencimento };
    setRascunho((r) => ({ ...r, [rotina]: { ...atual, ...patch } }));
  }

  function removerRegra(rotina: string) {
    setRascunho((r) => ({ ...r, [rotina]: null }));
  }

  function salvarRegras() {
    const limpo: Record<string, RegraVencimento> = { ...regrasVencimentoOverride };
    for (const [rotina, valor] of Object.entries(rascunho)) {
      if (valor === null) delete limpo[rotina];
      else limpo[rotina] = valor;
    }
    updateRegrasVencimentoOverride(limpo);
    setRascunho({});
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  }

  function toggleDesativada(setor: SetorRotina, rotina: string) {
    const existente = rotinasDesativadas.find((r) => r.setor === setor && r.rotina === rotina);
    if (existente) deleteRotinaDesativada(existente.id);
    else addRotinaDesativada({ id: `desativada-${setor}-${rotina}`, setor, rotina });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Regras de vencimento</CardTitle>
          <p className="text-[11px] text-sand-500">
            Dia do mês em que cada rotina vence, e o que acontece quando esse dia cai em fim de semana ou feriado nacional. Rotinas sem regra aqui
            não têm data de vencimento automática — só status mensal.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rotina</TableHead>
                <TableHead className="w-28">Dia</TableHead>
                <TableHead className="w-40">Se cair em fim de semana/feriado</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {todasAsRotinas.map((rotina) => {
                const regra = valorAtual(rotina);
                const padrao = REGRAS_VENCIMENTO_ROTINA_PADRAO[rotina];
                const ehPadrao = !!padrao && regra?.dia === padrao.dia && regra?.ajuste === padrao.ajuste;
                return (
                  <TableRow key={rotina}>
                    <TableCell className="font-medium">
                      {rotina}
                      {ehPadrao && <span className="ml-1.5 text-[10px] font-normal text-sand-400">(padrão)</span>}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={regra?.dia ?? ""}
                        onChange={(e) => mudarRegra(rotina, { dia: Number(e.target.value) || 1 })}
                        placeholder="—"
                        className="h-8 w-20 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={regra?.ajuste ?? "nenhum"}
                        onValueChange={(v) => mudarRegra(rotina, { ajuste: v as AjusteVencimento })}
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {AJUSTES.map((a) => (<SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {regra && (
                        <button
                          type="button"
                          onClick={() => removerRegra(rotina)}
                          title="Remover regra (volta a não ter vencimento automático)"
                          className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
                        >
                          <Ban className="size-3.5" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="mt-3 flex items-center gap-2">
            <Button type="button" onClick={salvarRegras}>
              <Save className="size-3.5" /> Salvar alterações
            </Button>
            {salvo && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-status-success">
                <Check className="size-3.5" /> Salvo
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quais rotinas cada setor cobra</CardTitle>
          <p className="text-[11px] text-sand-500">
            Desativar uma rotina tira ela de todo mundo do setor — some do checklist, de Obrigações e das métricas, pra sempre, até reativar.
          </p>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          {(Object.keys(CATALOGO_POR_SETOR) as SetorRotina[]).map((setor) => (
            <div key={setor}>
              <p className="mb-2 text-xs font-semibold text-sand-700">{setor}</p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {CATALOGO_POR_SETOR[setor].map((rotina) => {
                  const desativada = isRotinaDesativadaNoSetor(rotinasDesativadas, setor, rotina);
                  return (
                    <button
                      key={rotina}
                      type="button"
                      onClick={() => toggleDesativada(setor, rotina)}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                        desativada ? "border-status-brown bg-status-brown-bg text-status-brown" : "border-sand-200 bg-white text-sand-700 hover:bg-sand-50"
                      )}
                    >
                      <span className="truncate">{rotina}</span>
                      {desativada ? <Ban className="size-3.5 shrink-0" /> : <Check className="size-3.5 shrink-0 text-status-success" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
