"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsLeft, ChevronsRight, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store/app-store";
import type { Client } from "@/lib/types";
import { cn } from "@/lib/utils";

function clienteLabel(c: Client) {
  return `${c.dados.nomeFantasia ?? c.dados.razaoSocial} - ${c.dados.cnpj}`;
}

export function EmpresasVinculadas({ memberId }: { memberId: string }) {
  const clients = useAppStore((s) => s.clients);
  const team = useAppStore((s) => s.team);
  const updateTeamMemberClientes = useAppStore((s) => s.updateTeamMemberClientes);
  const member = team.find((m) => m.id === memberId);

  const [selecionados, setSelecionados] = useState<string[]>(member?.clientesVinculados ?? []);
  const [buscaDisponiveis, setBuscaDisponiveis] = useState("");
  const [buscaVinculados, setBuscaVinculados] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const clientesOrdenados = useMemo(
    () => [...clients].sort((a, b) => clienteLabel(a).localeCompare(clienteLabel(b), "pt-BR")),
    [clients]
  );

  const disponiveis = useMemo(() => {
    const q = buscaDisponiveis.trim().toLowerCase();
    return clientesOrdenados.filter((c) => !selecionados.includes(c.id) && clienteLabel(c).toLowerCase().includes(q));
  }, [clientesOrdenados, selecionados, buscaDisponiveis]);

  const vinculados = useMemo(() => {
    const q = buscaVinculados.trim().toLowerCase();
    return clientesOrdenados.filter((c) => selecionados.includes(c.id) && clienteLabel(c).toLowerCase().includes(q));
  }, [clientesOrdenados, selecionados, buscaVinculados]);

  function vincular(id: string) {
    setSelecionados((s) => [...s, id]);
  }
  function desvincular(id: string) {
    setSelecionados((s) => s.filter((cid) => cid !== id));
  }
  function vincularTodas() {
    setSelecionados((s) => [...new Set([...s, ...disponiveis.map((c) => c.id)])]);
  }
  function desvincularTodas() {
    const idsVisiveis = new Set(vinculados.map((c) => c.id));
    setSelecionados((s) => s.filter((cid) => !idsVisiveis.has(cid)));
  }

  function salvar() {
    updateTeamMemberClientes(memberId, selecionados);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  if (!member) return null;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Empresas vinculadas</CardTitle>
        <p className="text-[11px] text-sand-500">
          Sem nenhuma empresa vinculada, {member.nome.split(" ")[0]} vê todos os clientes normalmente. Vinculando pelo menos uma,
          o acesso fica restrito só a elas.
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="mb-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={vincularTodas} disabled={disponiveis.length === 0}>
            <ChevronsRight className="size-3.5" /> Vincular todas
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={desvincularTodas} disabled={vinculados.length === 0}>
            <ChevronsLeft className="size-3.5" /> Desvincular todas
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button type="button" size="sm" onClick={salvar}>Salvar</Button>
            {savedAt && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-status-success">
                <Check className="size-3.5" /> Salvo
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-sand-200">
            <div className="border-b border-sand-200 p-2">
              <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-sand-500">
                Não vinculadas ({disponiveis.length})
              </p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
                <Input
                  value={buscaDisponiveis}
                  onChange={(e) => setBuscaDisponiveis(e.target.value)}
                  placeholder="Buscar..."
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
            <ul className="h-64 overflow-y-auto">
              {disponiveis.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => vincular(c.id)}
                    className="block w-full truncate px-3 py-1.5 text-left text-xs text-sand-700 hover:bg-sand-50"
                    title="Clique para vincular"
                  >
                    {clienteLabel(c)}
                  </button>
                </li>
              ))}
              {disponiveis.length === 0 && <li className="px-3 py-6 text-center text-xs text-sand-400">Nenhuma empresa encontrada.</li>}
            </ul>
          </div>

          <div className="rounded-xl border border-sand-200">
            <div className="border-b border-sand-200 p-2">
              <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-wine-700">
                Vinculadas ({vinculados.length})
              </p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
                <Input
                  value={buscaVinculados}
                  onChange={(e) => setBuscaVinculados(e.target.value)}
                  placeholder="Buscar..."
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
            <ul className="h-64 overflow-y-auto">
              {vinculados.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => desvincular(c.id)}
                    className={cn("block w-full truncate px-3 py-1.5 text-left text-xs text-wine-800 hover:bg-wine-50")}
                    title="Clique para desvincular"
                  >
                    {clienteLabel(c)}
                  </button>
                </li>
              ))}
              {vinculados.length === 0 && (
                <li className="px-3 py-6 text-center text-xs text-sand-400">Nenhuma empresa vinculada — vê todos os clientes.</li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
