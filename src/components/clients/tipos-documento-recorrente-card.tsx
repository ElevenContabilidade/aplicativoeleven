"use client";

import { useState } from "react";
import { Plus, Trash2, ListChecks, Send, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { DOCUMENT_CATEGORIAS } from "@/components/documents/document-upload-dialog";
import type { DocumentoCategoria } from "@/lib/types";

const MESES = [
  { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" }, { value: "03", label: "Março" },
  { value: "04", label: "Abril" }, { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
  { value: "07", label: "Julho" }, { value: "08", label: "Agosto" }, { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" }, { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];
const YEARS = Array.from({ length: 2034 - 2024 + 1 }, (_, i) => String(2024 + i)).reverse();

function mesAnterior(): { ano: string; mes: string } {
  const hoje = new Date();
  const anterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  return { ano: String(anterior.getFullYear()), mes: String(anterior.getMonth() + 1).padStart(2, "0") };
}

/** Configura, por cliente, quais tipos de documento o escritório espera
 * receber todo mês (ex: "Extrato Bancário OFX") — vira o checklist mensal
 * que o cliente vê no Portal, com grid ano x mês, e alimenta o lembrete
 * mensal por e-mail (disparado por cron ou manualmente aqui). */
export function TiposDocumentoRecorrenteCard({ clienteId }: { clienteId: string }) {
  const todosTipos = useAppStore((s) => s.tiposDocumentoRecorrente);
  const tipos = todosTipos.filter((t) => t.clienteId === clienteId);
  const addTipoDocumentoRecorrente = useAppStore((s) => s.addTipoDocumentoRecorrente);
  const updateTipoDocumentoRecorrente = useAppStore((s) => s.updateTipoDocumentoRecorrente);
  const deleteTipoDocumentoRecorrente = useAppStore((s) => s.deleteTipoDocumentoRecorrente);

  const [novoNome, setNovoNome] = useState("");
  const [novaCategoria, setNovaCategoria] = useState<DocumentoCategoria>("Outros");
  const [{ ano: anoLembrete, mes: mesLembrete }, setCompetenciaLembrete] = useState(mesAnterior);
  const [enviandoLembrete, setEnviandoLembrete] = useState(false);
  const [emailTeste, setEmailTeste] = useState("");
  const [enviandoTeste, setEnviandoTeste] = useState(false);
  const [mensagemEnvio, setMensagemEnvio] = useState<{ texto: string; erro: boolean } | null>(null);

  const competenciaLembrete = `${anoLembrete}-${mesLembrete}`;

  function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!novoNome.trim()) return;
    addTipoDocumentoRecorrente({
      id: `tdr-${Date.now()}`,
      clienteId,
      nome: novoNome.trim(),
      ativo: true,
      criadoEm: new Date().toISOString(),
      categoria: novaCategoria,
    });
    setNovoNome("");
  }

  async function enviarLembreteAgora() {
    setEnviandoLembrete(true);
    setMensagemEnvio(null);
    try {
      const res = await fetch("/api/documentos/enviar-lembrete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId, competencia: competenciaLembrete }),
      });
      const json = await res.json();
      if (!json.ok) setMensagemEnvio({ texto: json.error ?? "Não foi possível enviar o lembrete.", erro: true });
      else if (!json.enviado) setMensagemEnvio({ texto: json.motivo ?? "Lembrete não enviado.", erro: true });
      else setMensagemEnvio({ texto: `Lembrete enviado para ${json.clienteNome ?? "o cliente"}.`, erro: false });
    } catch {
      setMensagemEnvio({ texto: "Erro ao enviar o lembrete.", erro: true });
    } finally {
      setEnviandoLembrete(false);
    }
  }

  async function enviarTeste() {
    if (!emailTeste.trim()) return;
    setEnviandoTeste(true);
    setMensagemEnvio(null);
    try {
      const res = await fetch("/api/documentos/enviar-teste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId, email: emailTeste.trim(), competencia: competenciaLembrete }),
      });
      const json = await res.json();
      if (!json.ok) setMensagemEnvio({ texto: json.error ?? "Não foi possível enviar o e-mail de teste.", erro: true });
      else setMensagemEnvio({ texto: `E-mail de teste enviado para ${emailTeste.trim()}.`, erro: false });
    } catch {
      setMensagemEnvio({ texto: "Erro ao enviar o e-mail de teste.", erro: true });
    } finally {
      setEnviandoTeste(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-sand-700">
          <ListChecks className="size-3.5 text-wine-600" /> Checklist mensal de documentos do cliente
        </p>
        <p className="text-[11px] text-sand-500">
          O cliente vê essa lista todo mês no Portal dele e envia direto por lá (ex: &ldquo;Extrato Bancário OFX&rdquo;, &ldquo;Extrato Bancário PDF&rdquo;).
        </p>

        <div className="space-y-1.5">
          {tipos.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-sand-200 px-3 py-2 text-xs">
              <span className={t.ativo ? "text-sand-800" : "text-sand-400 line-through"}>{t.nome}</span>
              <div className="flex shrink-0 items-center gap-2">
                <Select
                  value={t.categoria ?? "Outros"}
                  onValueChange={(v) => updateTipoDocumentoRecorrente(t.id, { categoria: v as DocumentoCategoria })}
                >
                  <SelectTrigger className="h-7 w-36 text-[11px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIAS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Switch checked={t.ativo} onCheckedChange={(v) => updateTipoDocumentoRecorrente(t.id, { ativo: v })} />
                <button
                  type="button"
                  onClick={() => confirm(`Remover "${t.nome}" do checklist mensal?`) && deleteTipoDocumentoRecorrente(t.id)}
                  className="flex size-6 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
          {tipos.length === 0 && <p className="text-xs text-sand-400">Nenhum tipo configurado ainda.</p>}
        </div>

        <form onSubmit={adicionar} className="flex gap-2">
          <Input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Ex.: Extrato Bancário OFX"
            className="h-8 text-xs"
          />
          <Select value={novaCategoria} onValueChange={(v) => setNovaCategoria(v as DocumentoCategoria)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DOCUMENT_CATEGORIAS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" variant="outline">
            <Plus className="size-3.5" /> Adicionar
          </Button>
        </form>

        {tipos.some((t) => t.ativo) && (
          <div className="space-y-2 rounded-lg border border-sand-200 p-3">
            <p className="text-[11px] font-semibold text-sand-700">Lembrete mensal por e-mail</p>
            <p className="text-[11px] text-sand-500">
              Todo mês (dia configurado em LEMBRETE_DOCUMENTOS_DIA), quem tiver documento pendente do mês anterior recebe um
              e-mail cobrando automaticamente. Pra disparar na hora, escolha a competência que o e-mail vai cobrar:
            </p>
            <div className="flex items-center gap-2">
              <Select value={mesLembrete} onValueChange={(v) => setCompetenciaLembrete((c) => ({ ...c, mes: v }))}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MESES.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={anoLembrete} onValueChange={(v) => setCompetenciaLembrete((c) => ({ ...c, ano: v }))}>
                <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" size="sm" variant="outline" disabled={enviandoLembrete} onClick={enviarLembreteAgora}>
              {enviandoLembrete ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Enviar lembrete de{" "}
              {MESES.find((m) => m.value === mesLembrete)?.label}/{anoLembrete} agora
            </Button>

            <div className="flex gap-2 pt-1">
              <Input
                type="email"
                value={emailTeste}
                onChange={(e) => setEmailTeste(e.target.value)}
                placeholder="Enviar e-mail de teste para..."
                className="h-8 text-xs"
              />
              <Button type="button" size="sm" variant="outline" disabled={!emailTeste.trim() || enviandoTeste} onClick={enviarTeste}>
                {enviandoTeste ? <Loader2 className="size-3.5 animate-spin" /> : "Testar"}
              </Button>
            </div>

            {mensagemEnvio && (
              <p className={`text-[11px] ${mensagemEnvio.erro ? "text-status-danger" : "text-status-success"}`}>{mensagemEnvio.texto}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
