"use client";

import { useState } from "react";
import { MessageSquarePlus, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/** Canal direto do cliente com a Eleven — vira uma tarefa no Atendimento pro
 * responsável de relacionamento dele, sem precisar mandar por WhatsApp. */
export function SolicitacaoCard({ clienteId }: { clienteId: string }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prazo, setPrazo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function enviar() {
    if (!titulo.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/portal/solicitacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId, titulo, descricao: descricao || undefined, prazo: prazo || undefined }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Não foi possível enviar sua solicitação.");
      setTitulo("");
      setDescricao("");
      setPrazo("");
      setEnviado(true);
      setTimeout(() => setEnviado(false), 4000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar sua solicitação.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquarePlus className="size-4 text-wine-600" /> Fazer uma solicitação
        </CardTitle>
        <p className="mt-1 text-xs text-sand-500">
          Precisa de algo da sua contabilidade? Descreva aqui e alguém da equipe entra em contato.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Assunto (ex: preciso de uma certidão negativa)" />
        <Textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Detalhe o que você precisa (opcional)"
          rows={3}
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-sand-500">
            Prazo desejado (opcional)
            <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="h-8 w-40 text-xs" />
          </label>
        </div>

        {erro && <p className="text-xs text-status-danger">{erro}</p>}
        {enviado && (
          <p className="flex items-center gap-1.5 text-xs text-status-success">
            <Check className="size-3.5" /> Solicitação enviada — a equipe vai te retornar em breve.
          </p>
        )}

        <Button type="button" size="sm" disabled={!titulo.trim() || enviando} onClick={enviar}>
          {enviando ? "Enviando..." : "Enviar solicitação"}
        </Button>
      </CardContent>
    </Card>
  );
}
