"use client";

import { useState } from "react";
import { Plus, Trash2, ListChecks } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/lib/store/app-store";

/** Configura, por cliente, quais tipos de documento o escritório espera
 * receber todo mês (ex: "Extrato Bancário OFX") — vira o checklist mensal
 * que o cliente vê no Portal, com grid ano x mês. */
export function TiposDocumentoRecorrenteCard({ clienteId }: { clienteId: string }) {
  const tipos = useAppStore((s) => s.tiposDocumentoRecorrente.filter((t) => t.clienteId === clienteId));
  const addTipoDocumentoRecorrente = useAppStore((s) => s.addTipoDocumentoRecorrente);
  const updateTipoDocumentoRecorrente = useAppStore((s) => s.updateTipoDocumentoRecorrente);
  const deleteTipoDocumentoRecorrente = useAppStore((s) => s.deleteTipoDocumentoRecorrente);

  const [novoNome, setNovoNome] = useState("");

  function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!novoNome.trim()) return;
    addTipoDocumentoRecorrente({
      id: `tdr-${Date.now()}`,
      clienteId,
      nome: novoNome.trim(),
      ativo: true,
      criadoEm: new Date().toISOString(),
    });
    setNovoNome("");
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-sand-700">
          <ListChecks className="size-3.5 text-wine-600" /> Checklist mensal de documentos do cliente
        </p>
        <p className="text-[11px] text-sand-500">
          O cliente vê essa lista todo mês no Portal dele e envia direto por lá (ex: &ldquo;Extrato Bancário OFX&rdquo;, &ldquo;Extrato Bancário PDF&rdquo;).
        </p>

        <div className="space-y-1.5">
          {tipos.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-sand-200 px-3 py-2 text-xs">
              <span className={t.ativo ? "text-sand-800" : "text-sand-400 line-through"}>{t.nome}</span>
              <div className="flex shrink-0 items-center gap-3">
                <Switch checked={t.ativo} onCheckedChange={(v) => updateTipoDocumentoRecorrente(t.id, { ativo: v })} />
                <button
                  type="button"
                  onClick={() => confirm(`Remover "${t.nome}" do checklist mensal?`) && deleteTipoDocumentoRecorrente(t.id)}
                  className="flex size-6 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
          {tipos.length === 0 && <p className="text-xs text-sand-400">Nenhum tipo configurado ainda.</p>}
        </div>

        <form onSubmit={adicionar} className="flex gap-2">
          <Input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Ex.: Extrato Bancário OFX"
            className="h-8 text-xs"
          />
          <Button type="submit" size="sm" variant="outline">
            <Plus className="size-3.5" /> Adicionar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
