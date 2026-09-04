"use client";

import { useState } from "react";
import { UploadCloud, Check, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";

const TIPOS_LOCAIS = [
  "clients",
  "recebimentos",
  "parcelamentos",
  "enviosParcelamento",
  "boletosMensais",
  "notasFiscaisMensais",
  "recebimentosParceiro",
  "despesasAvulsas",
  "pagamentosSistemas",
  "leads",
  "tasks",
  "obligations",
  "processosSocietarios",
  "certificados",
  "anotacoes",
  "timeline",
  "servicosExtras",
  "licencas",
  "indicacoes",
  "servicosPortfolio",
  "checklistContabil",
  "checklistFiscal",
  "checklistPessoal",
  "checklistMei",
  "sistemasEscritorio",
  "contratosAssinatura",
  "funcionarios",
] as const;

interface ItemComId {
  id: string;
  clienteId?: string;
}

/** Ferramenta de uso único: lê o que ainda está salvo no localStorage
 * desse navegador (todo módulo que ainda não tinha sido migrado pro
 * Supabase: Clientes, Financeiro, Tarefas, Obrigações, Leads, Societário,
 * Certificados, Licenças, checklists de rotina etc.) e sobe tudo pro
 * banco. Só precisa ser usada uma vez, no navegador que tem os dados
 * reais mais atualizados — depois disso os dados já vêm do Supabase pra
 * todo mundo. */
export function ImportarDadosLocaisCard() {
  const team = useAppStore((s) => s.team);
  const { userId } = useAuthStore();
  const isAdmin = team.find((m) => m.id === userId)?.perfil === "Administrador";
  const [status, setStatus] = useState<"idle" | "importando" | "feito" | "erro" | "vazio">("idle");
  const [resumo, setResumo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (!isAdmin) return null;

  async function importar() {
    setStatus("importando");
    setErro(null);
    try {
      const raw = localStorage.getItem("eleven-hub-store");
      if (!raw) {
        setStatus("vazio");
        return;
      }
      const parsed = JSON.parse(raw);
      const state = parsed?.state ?? {};

      const linhas: { tipo: string; id: string; cliente_id: string | null; data: unknown }[] = [];
      for (const tipo of TIPOS_LOCAIS) {
        const lista = state[tipo] as ItemComId[] | undefined;
        if (!Array.isArray(lista)) continue;
        for (const item of lista) {
          if (!item?.id) continue;
          const clienteId = tipo === "clients" ? item.id : item.clienteId ?? null;
          linhas.push({ tipo, id: item.id, cliente_id: clienteId, data: item });
        }
      }

      // Config de escritório: itens únicos, não listas.
      if (state.dadosEscritorio) {
        linhas.push({ tipo: "dadosEscritorio", id: "default", cliente_id: null, data: state.dadosEscritorio });
      }
      if (typeof state.metaMensalClientes === "number") {
        linhas.push({ tipo: "metaMensalClientes", id: "default", cliente_id: null, data: { valor: state.metaMensalClientes } });
      }
      // Só o "lida" dos alertas — o resto é recalculado a partir do resto dos dados.
      const notifications = state.notifications as { id: string; lida?: boolean }[] | undefined;
      if (Array.isArray(notifications)) {
        for (const n of notifications) {
          if (n?.id && n.lida) linhas.push({ tipo: "notificacoesLidas", id: n.id, cliente_id: null, data: { id: n.id, lida: true } });
        }
      }

      if (linhas.length === 0) {
        setStatus("vazio");
        return;
      }

      const supabase = createClient();
      const tamanhoLote = 200;
      for (let i = 0; i < linhas.length; i += tamanhoLote) {
        const lote = linhas.slice(i, i + tamanhoLote);
        const { error } = await supabase.from("dados_financeiros").upsert(lote, { onConflict: "tipo,id" });
        if (error) throw new Error(error.message);
      }

      const tipos = Array.from(new Set(linhas.map((l) => l.tipo)));
      const porTipo = tipos.map((t) => `${linhas.filter((l) => l.tipo === t).length} ${t}`).join(", ");
      setResumo(`${linhas.length} registros importados (${porTipo}).`);
      setStatus("feito");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível importar.");
      setStatus("erro");
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Importar dados locais pro banco</CardTitle>
        <p className="mt-1 text-xs text-sand-500">
          Ferramenta de uso único: sobe pro Supabase tudo que ainda está salvo só nesse navegador (Clientes,
          Financeiro, Tarefas, Obrigações, Leads, Societário, Certificados, Licenças, checklists de rotina e mais).
          Use no navegador com os dados mais atualizados, uma vez só.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {status === "feito" && resumo && (
          <p className="flex items-center gap-1.5 text-xs text-status-success">
            <Check className="size-3.5" /> {resumo}
          </p>
        )}
        {status === "vazio" && (
          <p className="text-xs text-sand-500">Não achei dados locais de Clientes/Financeiro nesse navegador.</p>
        )}
        {status === "erro" && erro && (
          <p className="flex items-center gap-1.5 text-xs text-status-danger">
            <AlertTriangle className="size-3.5" /> {erro}
          </p>
        )}
        <Button type="button" size="sm" onClick={importar} disabled={status === "importando"}>
          <UploadCloud className="size-3.5" /> {status === "importando" ? "Importando..." : "Importar dados locais"}
        </Button>
      </CardContent>
    </Card>
  );
}
