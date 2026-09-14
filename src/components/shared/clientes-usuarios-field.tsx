"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";

/** Escolhe quais clientes usam um sistema/despesa — usado em Rentabilidade
 * pra ratear o custo só entre quem de fato usa, em vez de todo mundo.
 * `undefined` = todos os clientes (comportamento padrão, sem exceção). */
export function ClientesUsuariosField({
  value,
  onChange,
  label = "Quais clientes usam isso?",
}: {
  value: string[] | undefined;
  onChange: (ids: string[] | undefined) => void;
  label?: string;
}) {
  const clientsRaw = useAppStore((s) => s.clients);
  const [search, setSearch] = useState("");
  const modoTodos = value === undefined;
  const selecionados = new Set(value ?? []);

  const clients = useMemo(
    () =>
      [...clientsRaw].sort((a, b) =>
        (a.dados.nomeFantasia ?? a.dados.razaoSocial).localeCompare(b.dados.nomeFantasia ?? b.dados.razaoSocial, "pt-BR")
      ),
    [clientsRaw]
  );

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) => c.dados.razaoSocial.toLowerCase().includes(q) || (c.dados.nomeFantasia ?? "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  const todosSelecionados = clients.length > 0 && clients.every((c) => selecionados.has(c.id));

  function toggleCliente(id: string) {
    const next = new Set(selecionados);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange([...next]);
  }

  function toggleTodos() {
    onChange(todosSelecionados ? [] : clients.map((c) => c.id));
  }

  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      <div className="mb-2 flex gap-2">
        <Button type="button" size="sm" variant={modoTodos ? "primary" : "outline"} onClick={() => onChange(undefined)}>
          Todos os clientes
        </Button>
        <Button type="button" size="sm" variant={!modoTodos ? "primary" : "outline"} onClick={() => onChange(value ?? [])}>
          Só alguns clientes
        </Button>
      </div>
      {!modoTodos && (
        <>
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <div className="max-h-56 overflow-y-auto rounded-lg border border-sand-200">
            <label className="flex items-center gap-2 border-b border-sand-100 bg-sand-50 px-3 py-1.5 text-xs font-medium hover:bg-sand-100">
              <Checkbox checked={todosSelecionados} onCheckedChange={toggleTodos} />
              <span>Selecionar todos</span>
            </label>
            {filtrados.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2 border-b border-sand-100 px-3 py-1.5 text-xs last:border-b-0 hover:bg-sand-50"
              >
                <Checkbox checked={selecionados.has(c.id)} onCheckedChange={() => toggleCliente(c.id)} />
                <span className="truncate">{c.dados.nomeFantasia ?? c.dados.razaoSocial}</span>
              </label>
            ))}
            {filtrados.length === 0 && (
              <p className="px-3 py-4 text-center text-[11px] text-sand-400">Nenhum cliente encontrado.</p>
            )}
          </div>
          <p className="mt-1 text-[11px] text-sand-400">
            {selecionados.size} cliente{selecionados.size === 1 ? "" : "s"} selecionado{selecionados.size === 1 ? "" : "s"}
          </p>
        </>
      )}
    </div>
  );
}
