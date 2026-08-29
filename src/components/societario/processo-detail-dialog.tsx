"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { TEAM, teamName } from "@/lib/data/seed";
import type { ProcessoSocietario, ProcessoSocietarioStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const STATUSES: ProcessoSocietarioStatus[] = ["Solicitado", "Documentação", "Protocolo", "Em análise", "Exigência", "Aprovado", "Finalizado"];

export function ProcessoDetailDialog({ processo, onClose }: { processo: ProcessoSocietario | null; onClose: () => void }) {
  const clients = useAppStore((s) => s.clients);
  const updateProcessoSocietario = useAppStore((s) => s.updateProcessoSocietario);
  const addEtapaProcesso = useAppStore((s) => s.addEtapaProcesso);
  const toggleEtapaProcesso = useAppStore((s) => s.toggleEtapaProcesso);
  const deleteEtapaProcesso = useAppStore((s) => s.deleteEtapaProcesso);

  const [descricao, setDescricao] = useState("");
  const [responsavelId, setResponsavelId] = useState(TEAM[0].id);
  const [inicio, setInicio] = useState(new Date().toISOString().slice(0, 10));
  const [prazo, setPrazo] = useState(new Date().toISOString().slice(0, 10));

  if (!processo) return null;
  const client = clients.find((c) => c.id === processo.clienteId);
  const feitas = processo.etapas.filter((e) => e.feito).length;

  function addEtapa() {
    if (!descricao.trim() || !processo) return;
    addEtapaProcesso(processo.id, { id: `et-${Date.now()}`, descricao, responsavelId, inicio, prazo, feito: false });
    setDescricao("");
  }

  return (
    <Dialog open={!!processo} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{processo.tipoServico}</DialogTitle>
          {client && <p className="text-xs text-sand-500">{client.dados.nomeFantasia ?? client.dados.razaoSocial} • {client.dados.cnpj}</p>}
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{processo.orgao}</Badge>
          {processo.protocolo && <Badge variant="cream">Protocolo {processo.protocolo}</Badge>}
          <span className="text-xs text-sand-400">Aberto em {formatDate(processo.dataAbertura)} • Prazo {formatDate(processo.prazo)}</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block">Status</Label>
            <Select value={processo.status} onValueChange={(v) => updateProcessoSocietario(processo.id, { status: v as ProcessoSocietarioStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block">Responsável</Label>
            <Select value={processo.responsavelId} onValueChange={(v) => updateProcessoSocietario(processo.id, { responsavelId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TEAM.map((m) => (<SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="mb-1 block">Pendências / observações</Label>
            <Textarea
              value={processo.pendencias ?? processo.observacoes ?? ""}
              onChange={(e) => updateProcessoSocietario(processo.id, { pendencias: e.target.value })}
              className="min-h-16 text-xs"
            />
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs font-semibold text-sand-700">Etapas do processo</p>
            <span className="text-[11px] text-sand-400">{feitas}/{processo.etapas.length} concluídas</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="w-10">Feito</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {processo.etapas.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className={e.feito ? "text-sand-400 line-through" : "text-sand-800"}>{e.descricao}</TableCell>
                  <TableCell className="text-xs text-sand-500">{teamName(e.responsavelId)}</TableCell>
                  <TableCell className="text-xs text-sand-500">{formatDate(e.inicio)}</TableCell>
                  <TableCell className="text-xs text-sand-500">{formatDate(e.prazo)}</TableCell>
                  <TableCell><Checkbox checked={e.feito} onCheckedChange={() => toggleEtapaProcesso(processo.id, e.id)} /></TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => deleteEtapaProcesso(processo.id, e.id)}
                      title="Excluir etapa"
                      className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {processo.etapas.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-4 text-center text-xs text-sand-400">Nenhuma etapa cadastrada.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-3 grid grid-cols-[1fr_auto_auto_auto_auto] items-end gap-2">
            <div>
              <Label className="mb-1 block">Nova etapa</Label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição da etapa" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="mb-1 block">Responsável</Label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEAM.map((m) => (<SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Início</Label>
              <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="mb-1 block">Prazo</Label>
              <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="h-8 text-xs" />
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addEtapa}>Adicionar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
