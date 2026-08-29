"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { CLIENTS } from "@/lib/data/seed";
import { ETAPAS_ABERTURA_EMPRESA, type EtapaProcesso, type ProcessoSocietario, type ProcessoSocietarioStatus } from "@/lib/types";

const TIPOS_SERVICO = [
  "Abertura de empresa",
  "Alteração contratual",
  "Baixa",
  "Inscrição municipal",
  "Inscrição estadual",
  "Licenças",
  "Regularização",
  "Enquadramento",
];

const STATUSES: ProcessoSocietarioStatus[] = ["Solicitado", "Documentação", "Protocolo", "Em análise", "Exigência", "Aprovado", "Finalizado"];

export function ProcessoFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addProcessoSocietario = useAppStore((s) => s.addProcessoSocietario);
  const clients = useAppStore((s) => s.clients);
  const { userId } = useAuthStore();

  const [clienteId, setClienteId] = useState(clients[0]?.id ?? CLIENTS[0].id);
  const [tipoServico, setTipoServico] = useState(TIPOS_SERVICO[0]);
  const [orgao, setOrgao] = useState("");
  const [prazo, setPrazo] = useState("");
  const [status, setStatus] = useState<ProcessoSocietarioStatus>("Solicitado");
  const [observacoes, setObservacoes] = useState("");

  function reset() {
    setTipoServico(TIPOS_SERVICO[0]);
    setOrgao("");
    setPrazo("");
    setStatus("Solicitado");
    setObservacoes("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId || !orgao || !prazo) return;
    const today = new Date().toISOString().slice(0, 10);
    const etapas: EtapaProcesso[] =
      tipoServico === "Abertura de empresa"
        ? ETAPAS_ABERTURA_EMPRESA.map((descricao, i) => ({
            id: `et-${Date.now()}-${i}`,
            descricao,
            responsavelId: userId ?? "u7",
            inicio: today,
            prazo,
            status: "Pendente",
          }))
        : [];
    const processo: ProcessoSocietario = {
      id: `ps-${Date.now()}`,
      clienteId,
      tipoServico,
      responsavelId: userId ?? "u7",
      orgao,
      dataAbertura: today,
      prazo,
      status,
      observacoes: observacoes || undefined,
      etapas,
    };
    addProcessoSocietario(processo);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo processo societário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.dados.nomeFantasia ?? c.dados.razaoSocial}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Tipo de serviço</Label>
              <Select value={tipoServico} onValueChange={setTipoServico}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_SERVICO.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProcessoSocietarioStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Órgão *</Label>
              <Input value={orgao} onChange={(e) => setOrgao(e.target.value)} placeholder="Ex: Junta Comercial SP" required />
            </div>
            <div>
              <Label className="mb-1 block">Prazo *</Label>
              <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} required />
            </div>
          </div>

          <div>
            <Label className="mb-1 block">Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Criar processo</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
