"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Check, Plus, Trash2, Vote, ShieldQuestion, ArrowRight, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAppStore } from "@/lib/store/app-store";
import type { CrcTipoRegistro, CrcRegistroInfo, CrcEleicao, CrcDeclaracaoCoaf } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CrcPage() {
  const [revelado, setRevelado] = useState(false);

  return (
    <div>
      <PageHeader
        title="Gestão do CRC"
        description="Registro profissional (pessoal e da empresa) no Conselho Regional de Contabilidade."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => setRevelado((v) => !v)}>
            {revelado ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            {revelado ? "Ocultar número e código" : "Mostrar número e código"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RegistroCard tipo="pessoal" titulo="CRC Pessoal" revelado={revelado} />
        <RegistroCard tipo="empresa" titulo="CRC Empresa" revelado={revelado} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnuidadesCard tipo="pessoal" titulo="Anuidades — CRC Pessoal" />
        <AnuidadesCard tipo="empresa" titulo="Anuidades — CRC Empresa" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EleicoesCard />
        <CoafCard />
      </div>
    </div>
  );
}

function RegistroCard({ tipo, titulo, revelado }: { tipo: CrcTipoRegistro; titulo: string; revelado: boolean }) {
  const registro = useAppStore((s) => (tipo === "pessoal" ? s.crcRegistroPessoal : s.crcRegistroEmpresa));
  const updateCrcRegistro = useAppStore((s) => s.updateCrcRegistro);
  const anuidades = useAppStore((s) => s.crcAnuidades).filter((a) => a.tipo === tipo);
  const ufs = useAppStore((s) => s.crcUfs);
  const ufsComunicadas = ufs.filter((u) => (tipo === "pessoal" ? u.pessoalData : u.empresaData)).length;

  const [form, setForm] = useState<CrcRegistroInfo>(registro ?? {});
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const dirtyRef = useRef(false);

  // Mesmo caso do formulário de Dados do Escritório: no F5 a store começa
  // vazia e só recebe o registro de verdade do Supabase um instante depois
  // do primeiro render — resincroniza quando chegar, mas só enquanto o
  // usuário não começou a editar.
  useEffect(() => {
    if (!dirtyRef.current) setForm(registro ?? {});
  }, [registro]);

  function set<K extends keyof CrcRegistroInfo>(key: K, value: CrcRegistroInfo[K]) {
    dirtyRef.current = true;
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateCrcRegistro(tipo, form);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
  }

  const pagoNoTotal = anuidades.filter((a) => a.status === "Pago").reduce((acc, a) => acc + a.valor, 0);

  return (
    <Card>
      <CardHeader className="rounded-t-2xl bg-wine-900">
        <CardTitle className="text-cream-50">{titulo}</CardTitle>
        {form.dataRegistro && <p className="text-xs text-wine-200">registrado em {formatDate(form.dataRegistro)}</p>}
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
          <div>
            <Label className="mb-1 block">Registro</Label>
            <Input
              type={revelado ? "text" : "password"}
              value={form.numero ?? ""}
              onChange={(e) => set("numero", e.target.value)}
              autoComplete="off"
            />
          </div>
          <div>
            <Label className="mb-1 block">Código de acesso</Label>
            <Input
              type={revelado ? "text" : "password"}
              value={form.codigoAcesso ?? ""}
              onChange={(e) => set("codigoAcesso", e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label className="mb-1 block">Data do registro</Label>
            <Input type="date" value={form.dataRegistro ?? ""} onChange={(e) => set("dataRegistro", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block">Link do Drive</Label>
            <Input
              type="url"
              value={form.linkDrive ?? ""}
              onChange={(e) => set("linkDrive", e.target.value)}
              placeholder="https://drive.google.com/..."
            />
          </div>
          <div className="col-span-2 flex items-center gap-3 pt-1">
            <Button type="submit" size="sm">Salvar</Button>
            {savedAt && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-status-success">
                <Check className="size-3.5" /> Salvo
              </span>
            )}
          </div>
        </form>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-sand-100 pt-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-sand-400">Anuidades</p>
            <p className="mt-0.5 text-lg font-semibold text-sand-900">{anuidades.length}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-sand-400">Pago no total</p>
            <p className="mt-0.5 text-lg font-semibold text-sand-900">{formatCurrency(pagoNoTotal)}</p>
          </div>
          <Link href="/crc/ufs" className="group">
            <p className="text-[10px] font-medium uppercase tracking-wide text-sand-400">UFs comunicadas</p>
            <p className="mt-0.5 flex items-center gap-1 text-lg font-semibold text-wine-700 group-hover:underline">
              {ufsComunicadas} <ArrowRight className="size-3.5" />
            </p>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function AnuidadesCard({ tipo, titulo }: { tipo: CrcTipoRegistro; titulo: string }) {
  const anuidades = useAppStore((s) => s.crcAnuidades).filter((a) => a.tipo === tipo);
  const addCrcAnuidade = useAppStore((s) => s.addCrcAnuidade);
  const updateCrcAnuidade = useAppStore((s) => s.updateCrcAnuidade);
  const deleteCrcAnuidade = useAppStore((s) => s.deleteCrcAnuidade);

  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [valor, setValor] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!ano.trim() || !valor) return;
    addCrcAnuidade({ id: `crc-anu-${Date.now()}`, tipo, ano: ano.trim(), valor: Number(valor), status: "Em aberto" });
    setAno(String(new Date().getFullYear()));
    setValor("");
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{titulo}</CardTitle></CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-1.5">
          {anuidades.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-sand-100 px-3 py-2 text-xs">
              <span className="font-medium text-sand-800">{a.ano}</span>
              <span className="text-sand-600">{formatCurrency(a.valor)}</span>
              <Select value={a.status} onValueChange={(v) => updateCrcAnuidade(a.id, { status: v as typeof a.status })}>
                <SelectTrigger className="h-7 w-28 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Em aberto">Em aberto</SelectItem>
                </SelectContent>
              </Select>
              <button type="button" onClick={() => deleteCrcAnuidade(a.id)} className="text-sand-400 hover:text-status-danger">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          {anuidades.length === 0 && <p className="py-4 text-center text-xs text-sand-400">Nenhuma anuidade cadastrada.</p>}
        </div>
        <form onSubmit={handleAdd} className="mt-3 flex items-end gap-2 border-t border-sand-100 pt-3">
          <div className="flex-1">
            <Label className="mb-1 block text-[11px]">Ano</Label>
            <Input value={ano} onChange={(e) => setAno(e.target.value)} className="h-8" />
          </div>
          <div className="flex-1">
            <Label className="mb-1 block text-[11px]">Valor (R$)</Label>
            <Input type="number" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} className="h-8" />
          </div>
          <Button type="submit" size="sm" variant="outline"><Plus className="size-3.5" /></Button>
        </form>
      </CardContent>
    </Card>
  );
}

function EleicoesCard() {
  const eleicoes = useAppStore((s) => s.crcEleicoes);
  const addCrcEleicao = useAppStore((s) => s.addCrcEleicao);
  const deleteCrcEleicao = useAppStore((s) => s.deleteCrcEleicao);

  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [link, setLink] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!ano.trim()) return;
    const eleicao: CrcEleicao = {
      id: `crc-elei-${Date.now()}`,
      ano: ano.trim(),
      descricao: descricao.trim() || undefined,
      data: data || undefined,
      link: link.trim() || undefined,
    };
    addCrcEleicao(eleicao);
    setAno(String(new Date().getFullYear()));
    setDescricao("");
    setData("");
    setLink("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm"><Vote className="size-4 text-wine-600" /> Eleições — registros de votação</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-1.5">
          {eleicoes.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-sand-100 px-3 py-2 text-xs">
              <span className="font-medium text-sand-800">{e.ano}</span>
              <span className="flex-1 truncate text-sand-600">{e.descricao || "—"}</span>
              <span className="text-sand-400">{e.data ? formatDate(e.data) : "—"}</span>
              {e.link && (
                <a href={e.link} target="_blank" rel="noopener noreferrer" className="text-sand-400 hover:text-wine-700" title="Abrir site">
                  <ExternalLink className="size-3.5" />
                </a>
              )}
              <button type="button" onClick={() => deleteCrcEleicao(e.id)} className="text-sand-400 hover:text-status-danger">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          {eleicoes.length === 0 && <p className="py-4 text-center text-xs text-sand-400">Nenhum registro de votação ainda.</p>}
        </div>
        <form onSubmit={handleAdd} className="mt-3 space-y-2 border-t border-sand-100 pt-3">
          <div className="flex items-end gap-2">
            <div className="w-20">
              <Label className="mb-1 block text-[11px]">Ano</Label>
              <Input value={ano} onChange={(e) => setAno(e.target.value)} className="h-8" />
            </div>
            <div className="flex-1">
              <Label className="mb-1 block text-[11px]">Descrição</Label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} className="h-8" placeholder="Ex: Eleição da diretoria" />
            </div>
            <div className="w-36">
              <Label className="mb-1 block text-[11px]">Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="h-8" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="mb-1 block text-[11px]">Link do site</Label>
              <Input type="url" value={link} onChange={(e) => setLink(e.target.value)} className="h-8" placeholder="https://" />
            </div>
            <Button type="submit" size="sm" variant="outline"><Plus className="size-3.5" /> Adicionar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function CoafCard() {
  const declaracoes = useAppStore((s) => s.crcDeclaracoesCoaf);
  const addCrcDeclaracaoCoaf = useAppStore((s) => s.addCrcDeclaracaoCoaf);
  const updateCrcDeclaracaoCoaf = useAppStore((s) => s.updateCrcDeclaracaoCoaf);
  const deleteCrcDeclaracaoCoaf = useAppStore((s) => s.deleteCrcDeclaracaoCoaf);

  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [link, setLink] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!ano.trim()) return;
    const declaracao: CrcDeclaracaoCoaf = {
      id: `crc-coaf-${Date.now()}`,
      ano: ano.trim(),
      status: "Pendente",
      link: link.trim() || undefined,
    };
    addCrcDeclaracaoCoaf(declaracao);
    setAno(String(new Date().getFullYear() + 1));
    setLink("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm"><ShieldQuestion className="size-4 text-wine-600" /> COAF — declarações anuais</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-1.5">
          {declaracoes.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-sand-100 px-3 py-2 text-xs">
              <span className="font-medium text-sand-800">{d.ano}</span>
              <Select value={d.status} onValueChange={(v) => updateCrcDeclaracaoCoaf(d.id, { status: v as typeof d.status })}>
                <SelectTrigger className="h-7 w-28 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Enviada">Enviada</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
              <StatusBadge status={d.status} />
              {d.link && (
                <a href={d.link} target="_blank" rel="noopener noreferrer" className="text-sand-400 hover:text-wine-700" title="Abrir site">
                  <ExternalLink className="size-3.5" />
                </a>
              )}
              <button type="button" onClick={() => deleteCrcDeclaracaoCoaf(d.id)} className="text-sand-400 hover:text-status-danger">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          {declaracoes.length === 0 && <p className="py-4 text-center text-xs text-sand-400">Nenhuma declaração cadastrada.</p>}
        </div>
        <form onSubmit={handleAdd} className="mt-3 flex items-end gap-2 border-t border-sand-100 pt-3">
          <div className="w-20">
            <Label className="mb-1 block text-[11px]">Ano</Label>
            <Input value={ano} onChange={(e) => setAno(e.target.value)} className="h-8" />
          </div>
          <div className="flex-1">
            <Label className="mb-1 block text-[11px]">Link do site</Label>
            <Input type="url" value={link} onChange={(e) => setLink(e.target.value)} className="h-8" placeholder="https://" />
          </div>
          <Button type="submit" size="sm" variant="outline"><Plus className="size-3.5" /> Adicionar</Button>
        </form>
      </CardContent>
    </Card>
  );
}
