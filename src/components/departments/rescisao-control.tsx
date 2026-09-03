"use client";

import { useMemo, useState } from "react";
import { UserMinus, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store/app-store";
import { formatDate } from "@/lib/utils";

export function RescisaoControl() {
  const clients = useAppStore((s) => s.clients);
  const funcionarios = useAppStore((s) => s.funcionarios);
  const iniciarRescisao = useAppStore((s) => s.iniciarRescisao);
  const toggleRescisaoItem = useAppStore((s) => s.toggleRescisaoItem);

  const [desligandoId, setDesligandoId] = useState<string | null>(null);
  const [dataDesligamento, setDataDesligamento] = useState(new Date().toISOString().slice(0, 10));
  const [motivo, setMotivo] = useState("");

  const ativos = useMemo(
    () =>
      funcionarios
        .filter((f) => f.ativo)
        .map((f) => ({ f, cliente: clients.find((c) => c.id === f.clienteId) }))
        .filter((l) => l.cliente?.dados.possuiFuncionarios),
    [funcionarios, clients]
  );

  const desligados = useMemo(
    () =>
      funcionarios
        .filter((f) => f.rescisao)
        .map((f) => ({ f, cliente: clients.find((c) => c.id === f.clienteId) }))
        .sort((a, b) => (b.f.rescisao?.dataDesligamento ?? "").localeCompare(a.f.rescisao?.dataDesligamento ?? "")),
    [funcionarios, clients]
  );

  function abrirDesligamento(id: string) {
    setDesligandoId(id);
    setDataDesligamento(new Date().toISOString().slice(0, 10));
    setMotivo("");
  }

  function confirmarDesligamento() {
    if (!desligandoId) return;
    iniciarRescisao(desligandoId, dataDesligamento, motivo.trim() || undefined);
    setDesligandoId(null);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserMinus className="size-4 text-wine-600" /> Funcionários ativos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 pt-4">
          {ativos.map(({ f, cliente }) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2 text-xs">
              <span>
                <span className="font-medium text-sand-800">{f.nome}</span>{" "}
                <span className="text-sand-400">— {cliente!.dados.nomeFantasia || cliente!.dados.razaoSocial}</span>
              </span>
              <Button size="sm" variant="outline" onClick={() => abrirDesligamento(f.id)}>
                Desligar
              </Button>
            </div>
          ))}
          {ativos.length === 0 && <p className="text-xs text-sand-400">Nenhum funcionário ativo cadastrado.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardList className="size-4 text-wine-600" /> Processos de rescisão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {desligados.map(({ f, cliente }) => {
            const total = f.rescisao!.checklist.length;
            const feitos = f.rescisao!.checklist.filter((i) => i.concluido).length;
            const pct = total > 0 ? Math.round((feitos / total) * 100) : 0;
            return (
              <div key={f.id} className="rounded-lg border border-sand-200 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-sand-800">
                      {f.nome} <span className="font-normal text-sand-400">— {cliente!.dados.nomeFantasia || cliente!.dados.razaoSocial}</span>
                    </p>
                    <p className="text-[11px] text-sand-400">
                      Desligado em {formatDate(f.rescisao!.dataDesligamento)}
                      {f.rescisao!.motivo && ` — ${f.rescisao!.motivo}`}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-wine-700">{feitos}/{total} ({pct}%)</span>
                </div>
                <Progress value={pct} className="mb-3 h-2" />
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {f.rescisao!.checklist.map((item) => (
                    <label key={item.id} className="flex items-start gap-2 rounded-lg px-2 py-1 text-xs hover:bg-sand-50">
                      <Checkbox checked={item.concluido} onCheckedChange={() => toggleRescisaoItem(f.id, item.id)} className="mt-0.5" />
                      <span className={item.concluido ? "text-sand-400 line-through" : "text-sand-800"}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
          {desligados.length === 0 && <p className="text-xs text-sand-400">Nenhum processo de rescisão em andamento.</p>}
        </CardContent>
      </Card>

      <Dialog open={!!desligandoId} onOpenChange={(v) => !v && setDesligandoId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desligar funcionário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block">Data do desligamento *</Label>
              <Input type="date" value={dataDesligamento} onChange={(e) => setDataDesligamento(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Motivo</Label>
              <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex: Pedido de demissão, sem justa causa..." />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDesligandoId(null)}>Cancelar</Button>
            <Button type="button" onClick={confirmarDesligamento} disabled={!dataDesligamento}>Confirmar desligamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
