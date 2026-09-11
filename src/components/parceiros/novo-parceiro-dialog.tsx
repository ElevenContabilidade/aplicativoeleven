"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/lib/store/app-store";
import { ONBOARDING_TEMPLATE, type Client, type DepartamentoChave } from "@/lib/types";

const SETORES: { value: DepartamentoChave; label: string }[] = [
  { value: "fiscal", label: "Fiscal" },
  { value: "contabil", label: "Contábil" },
  { value: "pessoal", label: "Departamento Pessoal" },
];

export function NovoParceiroDialog({
  open,
  onOpenChange,
  parceirosExistentes,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Nomes de parceiro já usados, pra sugerir num datalist em vez de a
   * Kauane ter que digitar "ALLAN"/"BRENDA" igualzinho de novo. */
  parceirosExistentes: string[];
}) {
  const addClient = useAppStore((s) => s.addClient);

  const [nome, setNome] = useState("");
  const [nomeParceiro, setNomeParceiro] = useState("");
  const [valorMensal, setValorMensal] = useState("");
  const [setoresAtendidos, setSetoresAtendidos] = useState<DepartamentoChave[]>([]);

  function reset() {
    setNome(""); setNomeParceiro(""); setValorMensal(""); setSetoresAtendidos([]);
  }

  function toggleSetor(setor: DepartamentoChave) {
    setSetoresAtendidos((prev) => (prev.includes(setor) ? prev.filter((s) => s !== setor) : [...prev, setor]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !nomeParceiro.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    const id = `c-${Date.now()}`;
    const client: Client = {
      id,
      status: "Ativo",
      dados: {
        razaoSocial: nome.trim(),
        cnpj: "",
        cnaePrincipal: "—",
        cnaesSecundarios: [],
        naturezaJuridica: "—",
        dataAbertura: today,
        capitalSocial: 0,
        regimeTributario: "Simples Nacional",
        municipio: "—",
        estado: "—",
        endereco: "—",
        clienteParceiro: true,
        nomeParceiro: nomeParceiro.trim(),
        setoresAtendidos,
      },
      socios: [],
      contatos: [],
      responsaveis: {},
      segmento: "Parceiro",
      tags: [],
      financeiro: {
        valorMensal: Number(valorMensal) || 0,
        vencimentoDia: 10,
        formaPagamento: "PIX",
        inicioContrato: today,
        statusFinanceiro: "Em aberto",
      },
      historicoFinanceiro: [],
      onboarding: ONBOARDING_TEMPLATE.map((label, i) => ({ id: `ob-${id}-${i}`, label, concluido: false })),
      criadoEm: today,
    };
    addClient(client);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo parceiro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block">Nome do cliente/empresa *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Fulano de Tal" required />
          </div>
          <div>
            <Label className="mb-1 block">Nome do parceiro *</Label>
            <Input
              value={nomeParceiro}
              onChange={(e) => setNomeParceiro(e.target.value)}
              placeholder="Ex: Allan"
              list="parceiros-nomes"
              required
            />
            <datalist id="parceiros-nomes">
              {parceirosExistentes.map((p) => (<option key={p} value={p} />))}
            </datalist>
          </div>
          <div>
            <Label className="mb-1 block">Valor mensal (R$)</Label>
            <Input type="number" step="0.01" min="0" value={valorMensal} onChange={(e) => setValorMensal(e.target.value)} placeholder="0,00" />
          </div>
          <div>
            <Label className="mb-1 block">Setores atendidos pela Eleven</Label>
            <div className="flex flex-wrap gap-4">
              {SETORES.map((s) => (
                <label key={s.value} className="flex items-center gap-2 text-xs text-sand-700">
                  <Checkbox checked={setoresAtendidos.includes(s.value)} onCheckedChange={() => toggleSetor(s.value)} />
                  {s.label}
                </label>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-sand-400">
              Esse cliente só aparece nos checklists dos setores marcados aqui.
            </p>
          </div>
          <p className="text-[11px] text-sand-400">
            Cria um cadastro básico em Clientes (forma de pagamento PIX, sem boleto). Complete os demais dados lá se precisar.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Cadastrar parceiro</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
