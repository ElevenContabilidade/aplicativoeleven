"use client";

import { useState } from "react";
import { PartyPopper, Pencil, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function MetaMensalCard({ year, mes }: { year: string; mes: string }) {
  const clients = useAppStore((s) => s.clients);
  const metaMensalClientes = useAppStore((s) => s.metaMensalClientes);
  const updateMetaMensalClientes = useAppStore((s) => s.updateMetaMensalClientes);
  const [editando, setEditando] = useState(false);
  const [valorEdicao, setValorEdicao] = useState(String(metaMensalClientes));

  const hoje = new Date();
  const mesIndex = mes === "anual" ? hoje.getMonth() : Number(mes) - 1;
  const competencia = mes === "anual" ? hoje.toISOString().slice(0, 7) : `${year}-${mes}`;
  const clientesNoMes = clients.filter((c) => c.criadoEm.startsWith(competencia)).length;
  const meta = Math.max(metaMensalClientes, 1);
  const percentual = Math.round((clientesNoMes / meta) * 100);
  const atingiu = clientesNoMes >= meta;

  function salvarMeta() {
    const n = Number(valorEdicao);
    if (n > 0) updateMetaMensalClientes(n);
    setEditando(false);
  }

  return (
    <Card className="mb-4">
      <CardContent className="flex flex-wrap items-center gap-4 p-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-sand-500">
              Meta de novos clientes — {MESES[mesIndex]}{mes !== "anual" && `/${year}`}
            </p>
            {atingiu && (
              <span className="flex items-center gap-1 rounded-full bg-status-success-bg px-2 py-0.5 text-[10px] font-semibold text-status-success">
                <PartyPopper className="size-3" /> Meta atingida!
              </span>
            )}
          </div>
          <Progress value={Math.min(percentual, 100)} className="h-2.5" />
        </div>

        <div className="flex items-center gap-3">
          <p className="whitespace-nowrap text-sm">
            <span className="text-lg font-bold text-wine-700">{clientesNoMes}</span>
            <span className="text-sand-500"> / {meta} clientes</span>
            <span className="ml-1.5 font-semibold text-sand-700">({percentual}%)</span>
          </p>

          {editando ? (
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min="1"
                value={valorEdicao}
                onChange={(e) => setValorEdicao(e.target.value)}
                className="h-7 w-16 text-xs"
              />
              <Button type="button" size="icon" variant="outline" className="size-7" onClick={salvarMeta}>
                <Check className="size-3.5" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setValorEdicao(String(metaMensalClientes)); setEditando(true); }}
              title="Editar meta"
              className="rounded-md p-1.5 text-sand-400 hover:bg-sand-100 hover:text-sand-700"
            >
              <Pencil className="size-3.5" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
