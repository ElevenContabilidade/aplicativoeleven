"use client";

import { useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import type { Client, DadosCadastrais } from "@/lib/types";
import { lookupCnpj, maskCnpj, onlyDigits } from "@/lib/cnpj";

const REGIMES: DadosCadastrais["regimeTributario"][] = ["MEI", "Simples Nacional", "Lucro Presumido", "Lucro Real"];

export function CadastroForm({ client }: { client: Client }) {
  const updateClientDados = useAppStore((s) => s.updateClientDados);
  const [form, setForm] = useState<DadosCadastrais>(client.dados);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [buscaErro, setBuscaErro] = useState<string | null>(null);

  function set<K extends keyof DadosCadastrais>(key: K, value: DadosCadastrais[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function buscarCnpj() {
    if (onlyDigits(form.cnpj).length !== 14) {
      setBuscaErro("Digite os 14 dígitos do CNPJ para buscar.");
      return;
    }
    setBuscando(true);
    setBuscaErro(null);
    try {
      const dados = await lookupCnpj(form.cnpj);
      setForm((f) => ({
        ...f,
        razaoSocial: dados.razaoSocial || f.razaoSocial,
        nomeFantasia: dados.nomeFantasia ?? f.nomeFantasia,
        cnaePrincipal: dados.cnaePrincipal || f.cnaePrincipal,
        cnaesSecundarios: dados.cnaesSecundarios.length ? dados.cnaesSecundarios : f.cnaesSecundarios,
        naturezaJuridica: dados.naturezaJuridica || f.naturezaJuridica,
        dataAbertura: dados.dataAbertura || f.dataAbertura,
        capitalSocial: dados.capitalSocial || f.capitalSocial,
        regimeTributario: dados.regimeTributario ?? f.regimeTributario,
        municipio: dados.municipio || f.municipio,
        estado: dados.estado || f.estado,
        endereco: dados.endereco || f.endereco,
      }));
    } catch (err) {
      setBuscaErro(err instanceof Error ? err.message : "Não foi possível consultar o CNPJ.");
    } finally {
      setBuscando(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateClientDados(client.id, form);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Razão social" className="sm:col-span-2 lg:col-span-3">
            <Input value={form.razaoSocial} onChange={(e) => set("razaoSocial", e.target.value)} />
          </Field>
          <Field label="Nome fantasia">
            <Input value={form.nomeFantasia ?? ""} onChange={(e) => set("nomeFantasia", e.target.value)} />
          </Field>
          <Field label="CNPJ" className="sm:col-span-2 lg:col-span-1">
            <div className="flex gap-2">
              <Input value={form.cnpj} onChange={(e) => set("cnpj", maskCnpj(e.target.value))} />
              <Button type="button" size="sm" variant="outline" onClick={buscarCnpj} disabled={buscando} className="shrink-0">
                {buscando ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
                Buscar
              </Button>
            </div>
            {buscaErro && <p className="mt-1 text-[11px] text-status-danger">{buscaErro}</p>}
          </Field>
          <Field label="Inscrição estadual">
            <Input value={form.inscricaoEstadual ?? ""} onChange={(e) => set("inscricaoEstadual", e.target.value)} />
          </Field>
          <Field label="Inscrição municipal">
            <Input value={form.inscricaoMunicipal ?? ""} onChange={(e) => set("inscricaoMunicipal", e.target.value)} />
          </Field>
          <Field label="CNAE principal">
            <Input value={form.cnaePrincipal} onChange={(e) => set("cnaePrincipal", e.target.value)} />
          </Field>
          <Field label="Natureza jurídica">
            <Input value={form.naturezaJuridica} onChange={(e) => set("naturezaJuridica", e.target.value)} />
          </Field>
          <Field label="Data de abertura">
            <Input type="date" value={form.dataAbertura} onChange={(e) => set("dataAbertura", e.target.value)} />
          </Field>
          <Field label="Capital social (R$)">
            <Input
              type="number"
              value={form.capitalSocial}
              onChange={(e) => set("capitalSocial", Number(e.target.value))}
            />
          </Field>
          <Field label="Regime tributário">
            <Select value={form.regimeTributario} onValueChange={(v) => set("regimeTributario", v as DadosCadastrais["regimeTributario"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REGIMES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Município">
            <Input value={form.municipio} onChange={(e) => set("municipio", e.target.value)} />
          </Field>
          <Field label="Estado (UF)">
            <Input value={form.estado} maxLength={2} onChange={(e) => set("estado", e.target.value.toUpperCase())} />
          </Field>
          <Field label="Endereço" className="sm:col-span-2 lg:col-span-3">
            <Input value={form.endereco} onChange={(e) => set("endereco", e.target.value)} />
          </Field>

          <div className="flex items-center gap-3 pt-2 sm:col-span-2 lg:col-span-3">
            <Button type="submit" size="sm">
              Salvar alterações
            </Button>
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

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-1 block">{label}</Label>
      {children}
    </div>
  );
}
