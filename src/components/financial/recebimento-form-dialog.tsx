"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import type { Recebimento, TipoPessoaRecebimento } from "@/lib/types";

const STATUSES: Recebimento["status"][] = ["Pago", "Em aberto", "Atrasado", "Negociado", "Cancelado"];

const SEM_SERVICO = "—";

const BANCOS_PADRAO = [
  "Banco do Brasil",
  "Bradesco",
  "C6 Bank",
  "Caixa Econômica",
  "Inter",
  "Itaú",
  "Nubank",
  "Santander",
  "Sicoob",
  "Sicredi",
];

export function RecebimentoFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const clients = useAppStore((s) => s.clients);
  const servicosPortfolio = useAppStore((s) => s.servicosPortfolio);
  const recebimentos = useAppStore((s) => s.recebimentos);
  const addRecebimento = useAppStore((s) => s.addRecebimento);

  const [nome, setNome] = useState("");
  const [competencia, setCompetencia] = useState(new Date().toISOString().slice(0, 7));
  const [servico, setServico] = useState(SEM_SERVICO);
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<Recebimento["status"]>("Em aberto");
  const [banco, setBanco] = useState("");
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoaRecebimento>("PJ");

  const bancoOptions = useMemo(() => {
    const usados = recebimentos.map((r) => r.banco).filter((b): b is string => !!b);
    return [...new Set([...BANCOS_PADRAO, ...usados])].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [recebimentos]);

  function reset() {
    setNome("");
    setCompetencia(new Date().toISOString().slice(0, 7));
    setServico(SEM_SERVICO);
    setValor("");
    setVencimento(new Date().toISOString().slice(0, 10));
    setStatus("Em aberto");
    setBanco("");
    setTipoPessoa("PJ");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !valor) return;
    const entry: Recebimento = {
      id: `rec-${Date.now()}`,
      nome: nome.trim(),
      competencia,
      servico: servico === SEM_SERVICO ? undefined : servico,
      valor: Number(valor) || 0,
      vencimento,
      pagamento: status === "Pago" ? new Date().toISOString().slice(0, 10) : undefined,
      status,
      banco: banco.trim() || undefined,
      tipoPessoa,
    };
    addRecebimento(entry);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo recebimento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Cliente *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome da pessoa ou empresa"
              list="recebimento-clientes"
              required
            />
            <datalist id="recebimento-clientes">
              {clients.map((c) => (
                <option key={c.id} value={c.dados.nomeFantasia ?? c.dados.razaoSocial} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Competência</Label>
              <Input type="month" value={competencia} onChange={(e) => setCompetencia(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Tipo de serviço</Label>
              <Select value={servico} onValueChange={setServico}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_SERVICO}>{SEM_SERVICO}</SelectItem>
                  {servicosPortfolio.map((sp) => (<SelectItem key={sp.id} value={sp.nome}>{sp.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Valor (R$) *</Label>
              <Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} required />
            </div>
            <div>
              <Label className="mb-1 block">Vencimento</Label>
              <Input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Banco</Label>
              <Input value={banco} onChange={(e) => setBanco(e.target.value)} placeholder="Em qual banco caiu" list="recebimento-bancos" />
              <datalist id="recebimento-bancos">
                {bancoOptions.map((b) => (<option key={b} value={b} />))}
              </datalist>
            </div>
            <div>
              <Label className="mb-1 block">PF ou PJ</Label>
              <Select value={tipoPessoa} onValueChange={(v) => setTipoPessoa(v as TipoPessoaRecebimento)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PJ">PJ</SelectItem>
                  <SelectItem value="PF">PF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="mb-1 block">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Recebimento["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Registrar recebimento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
