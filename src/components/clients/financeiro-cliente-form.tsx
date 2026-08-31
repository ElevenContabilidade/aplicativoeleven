"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import type { Client, FinanceiroCliente } from "@/lib/types";

const STATUS_FINANCEIRO: FinanceiroCliente["statusFinanceiro"][] = ["Pago", "Em aberto", "Atrasado", "Negociado", "Cancelado"];

export function FinanceiroClienteForm({ client }: { client: Client }) {
  const updateFinanceiroCliente = useAppStore((s) => s.updateFinanceiroCliente);
  const [form, setForm] = useState<FinanceiroCliente>(client.financeiro);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function set<K extends keyof FinanceiroCliente>(key: K, value: FinanceiroCliente[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateFinanceiroCliente(client.id, form);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
          <div>
            <Label className="mb-1 block">Valor mensal (R$)</Label>
            <Input type="number" step="0.01" value={form.valorMensal} onChange={(e) => set("valorMensal", Number(e.target.value))} />
          </div>
          <div>
            <Label className="mb-1 block">Vencimento (dia)</Label>
            <Input type="number" min="1" max="31" value={form.vencimentoDia} onChange={(e) => set("vencimentoDia", Number(e.target.value))} />
          </div>
          <div>
            <Label className="mb-1 block">Forma de pagamento</Label>
            <Input value={form.formaPagamento} onChange={(e) => set("formaPagamento", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block">Início do contrato</Label>
            <Input type="date" value={form.inicioContrato} onChange={(e) => set("inicioContrato", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block">Reajuste</Label>
            <Input value={form.reajuste ?? ""} onChange={(e) => set("reajuste", e.target.value)} placeholder="Ex: anual, IGP-M" />
          </div>
          <div>
            <Label className="mb-1 block">Status financeiro</Label>
            <Select value={form.statusFinanceiro} onValueChange={(v) => set("statusFinanceiro", v as FinanceiroCliente["statusFinanceiro"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_FINANCEIRO.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 flex items-center gap-3 pt-1 sm:col-span-3">
            <Button type="submit" size="sm">Salvar alterações</Button>
            {savedAt && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-status-success">
                <Check className="size-3.5" /> Dados salvos
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
