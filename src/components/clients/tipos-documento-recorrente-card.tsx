"use client";

import { useState } from "react";
import { Plus, Trash2, ListChecks, Send, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/lib/store/app-store";

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
  const [enviandoLembrete, setEnviandoLembrete] = useState(false);
  const [emailTeste, setEmailTeste] = useState("");
  const [enviandoTeste, setEnviandoTeste] = useState(false);
  const [mensagemEnvio, setMensagemEnvio] = useState<{ texto: string; erro: boolean } | null>(null);

  function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!novoNome.trim()) return;
    addTipoDocumentoRecorrente({
      id: `tdr-${Date.now()}`,
      clienteId,
      nome: novoNome.trim(),
      ativo: true,
      criadoEm: new Date().toISOString(),
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
        body: JSON.stringify({ clienteId }),
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
        body: JSON.stringify({ clienteId, email: emailTeste.trim() }),
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
              <div className="flex shrink-0 items-center gap-3">
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
          <Button type="submit" size="sm" variant="outline">
            <Plus className="size-3.5" /> Adicionar
          </Button>
        </form>

        {tipos.some((t) => t.ativo) && (
          <div className="space-y-2 rounded-lg border border-sand-200 p-3">
            <p className="text-[11px] font-semibold text-sand-700">Lembrete mensal por e-mail</p>
            <p className="text-[11px] text-sand-500">
              Todo mês (dia configurado em LEMBRETE_DOCUMENTOS_DIA), quem tiver documento pendente do mês anterior recebe um
              e-mail cobrando. Também dá pra disparar na hora:
            </p>
            <Button type="button" size="sm" variant="outline" disabled={enviandoLembrete} onClick={enviarLembreteAgora}>
              {enviandoLembrete ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />} Enviar lembrete agora
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
