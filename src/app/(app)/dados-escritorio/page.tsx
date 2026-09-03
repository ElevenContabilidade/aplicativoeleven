"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";
import type { DadosEscritorio } from "@/lib/types";

export default function DadosEscritorioPage() {
  const dadosEscritorio = useAppStore((s) => s.dadosEscritorio);
  const updateDadosEscritorio = useAppStore((s) => s.updateDadosEscritorio);
  const [form, setForm] = useState<DadosEscritorio>(dadosEscritorio);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function set<K extends keyof DadosEscritorio>(key: K, value: DadosEscritorio[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateDadosEscritorio(form);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Dados do escritório" description="Informações cadastrais e de contato da Eleven, exibidas na plataforma." />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 pt-4 text-xs sm:grid-cols-2">
            <Field label="Razão social" className="sm:col-span-2">
              <Input value={form.razaoSocial} onChange={(e) => set("razaoSocial", e.target.value)} />
            </Field>
            <Field label="Nome fantasia">
              <Input value={form.nomeFantasia} onChange={(e) => set("nomeFantasia", e.target.value)} />
            </Field>
            <Field label="CNPJ">
              <Input value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
            </Field>
            <Field label="Inscrição municipal">
              <Input value={form.inscricaoMunicipal ?? ""} onChange={(e) => set("inscricaoMunicipal", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contato</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 pt-4 text-xs sm:grid-cols-2">
            <Field label="Telefone">
              <Input value={form.telefone ?? ""} onChange={(e) => set("telefone", e.target.value)} placeholder="(00) 0000-0000" />
            </Field>
            <Field label="WhatsApp">
              <Input value={form.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} placeholder="(00) 00000-0000" />
            </Field>
            <Field label="E-mail">
              <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Site">
              <Input type="url" value={form.site ?? ""} onChange={(e) => set("site", e.target.value)} placeholder="https://" />
            </Field>
            <Field label="Instagram" className="sm:col-span-2">
              <Input value={form.instagram ?? ""} onChange={(e) => set("instagram", e.target.value)} placeholder="@somoseleven" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Endereço</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 pt-4 text-xs sm:grid-cols-2">
            <Field label="Endereço" className="sm:col-span-2">
              <Input value={form.endereco ?? ""} onChange={(e) => set("endereco", e.target.value)} placeholder="Rua, número, bairro" />
            </Field>
            <Field label="Cidade">
              <Input value={form.cidade ?? ""} onChange={(e) => set("cidade", e.target.value)} />
            </Field>
            <Field label="Estado (UF)">
              <Input value={form.estado ?? ""} maxLength={2} onChange={(e) => set("estado", e.target.value.toUpperCase())} />
            </Field>
            <Field label="CEP">
              <Input value={form.cep ?? ""} onChange={(e) => set("cep", e.target.value)} placeholder="00000-000" />
            </Field>
            <Field label="Horário de atendimento">
              <Input value={form.horarioAtendimento ?? ""} onChange={(e) => set("horarioAtendimento", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm">Salvar alterações</Button>
          {savedAt && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-status-success">
              <Check className="size-3.5" /> Dados salvos
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-1 block">{label}</Label>
      {children}
    </div>
  );
}
