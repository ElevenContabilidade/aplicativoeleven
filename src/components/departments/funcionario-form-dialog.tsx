"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import type { Funcionario, TipoFuncionario } from "@/lib/types";

const TIPOS: TipoFuncionario[] = ["CLT", "MEI", "Doméstico"];

export function FuncionarioFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const clients = useAppStore((s) => s.clients);
  const addFuncionario = useAppStore((s) => s.addFuncionario);

  const clientesComFuncionarios = clients.filter((c) => c.dados.possuiFuncionarios);

  const [clienteId, setClienteId] = useState("");
  const [nome, setNome] = useState("");
  const [dataAdmissao, setDataAdmissao] = useState("");
  const [tipo, setTipo] = useState<TipoFuncionario>("CLT");

  function reset() {
    setClienteId("");
    setNome("");
    setDataAdmissao("");
    setTipo("CLT");
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId || !nome.trim() || !dataAdmissao) return;
    const funcionario: Funcionario = {
      id: `func-${Date.now()}`,
      clienteId,
      nome: nome.trim(),
      dataAdmissao,
      tipo,
      ativo: true,
      historicoFerias: [],
      decimosTerceiros: [],
    };
    addFuncionario(funcionario);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo funcionário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Cliente *</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent>
                {clientesComFuncionarios.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.dados.nomeFantasia || c.dados.razaoSocial}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {clientesComFuncionarios.length === 0 && (
              <p className="mt-1 text-[11px] text-status-warning">
                Nenhum cliente marcado como &quot;Possui funcionários&quot; ainda — marque essa opção no cadastro do cliente primeiro.
              </p>
            )}
          </div>
          <div>
            <Label className="mb-1 block">Nome do funcionário *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Data de admissão *</Label>
              <Input type="date" value={dataAdmissao} onChange={(e) => setDataAdmissao(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block">Tipo *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoFuncionario)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
            <Button type="submit" disabled={!clienteId || !nome.trim() || !dataAdmissao}>Cadastrar funcionário</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
