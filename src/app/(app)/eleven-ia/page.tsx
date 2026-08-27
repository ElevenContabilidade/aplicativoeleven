"use client";

import { useState } from "react";
import { Sparkles, Send, Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";

interface ChatMsg {
  role: "user" | "ia";
  text: string;
}

const SUGESTOES = [
  "Quais clientes estão com tarefas atrasadas?",
  "Quais certificados vencem nos próximos 30 dias?",
  "Quais clientes estão inadimplentes?",
  "Quais leads estão há mais de três dias sem contato?",
  "Quais empresas possuem pendências no Fiscal?",
  "Quanto vendemos este mês?",
];

function daysFromToday(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export default function ElevenIAPage() {
  const clients = useAppStore((s) => s.clients);
  const tasks = useAppStore((s) => s.tasks);
  const leads = useAppStore((s) => s.leads);
  const certificados = useAppStore((s) => s.certificados);
  const obligations = useAppStore((s) => s.obligations);

  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "ia", text: "Olá! Sou a Eleven IA. Posso consultar dados da plataforma para responder suas perguntas sobre clientes, tarefas, obrigações, certificados e comercial. Nunca altero dados sem sua confirmação." },
  ]);
  const [input, setInput] = useState("");

  function answer(question: string): string {
    const q = question.toLowerCase();

    if (q.includes("tarefa") && q.includes("atras")) {
      const overdue = tasks.filter((t) => !["Concluída", "Cancelada"].includes(t.status) && daysFromToday(t.prazo) < 0);
      if (overdue.length === 0) return "Nenhuma tarefa está atrasada no momento. 🎉";
      const names = overdue.map((t) => {
        const c = clients.find((cl) => cl.id === t.clienteId);
        return `• ${t.titulo}${c ? ` (${c.dados.nomeFantasia ?? c.dados.razaoSocial})` : ""}`;
      });
      return `Encontrei ${overdue.length} tarefa(s) atrasada(s):\n${names.join("\n")}`;
    }

    if (q.includes("certificado")) {
      const venc = certificados.filter((c) => { const d = daysFromToday(c.dataVencimento); return d >= 0 && d <= 30; });
      if (venc.length === 0) return "Nenhum certificado vence nos próximos 30 dias.";
      const lines = venc.map((c) => {
        const cl = clients.find((x) => x.id === c.clienteId);
        return `• ${c.tipo} — ${cl?.dados.nomeFantasia ?? cl?.dados.razaoSocial} (vence em ${daysFromToday(c.dataVencimento)} dias)`;
      });
      return `${venc.length} certificado(s) vencem nos próximos 30 dias:\n${lines.join("\n")}`;
    }

    if (q.includes("inadimplente")) {
      const inad = clients.filter((c) => c.financeiro.statusFinanceiro === "Atrasado");
      if (inad.length === 0) return "Nenhum cliente está inadimplente atualmente.";
      return `${inad.length} cliente(s) inadimplente(s):\n${inad.map((c) => `• ${c.dados.nomeFantasia ?? c.dados.razaoSocial}`).join("\n")}`;
    }

    if (q.includes("lead") && (q.includes("contato") || q.includes("sem retorno"))) {
      const stale = leads.filter((l) => !["Fechado", "Perdido"].includes(l.stage) && daysFromToday(l.dataUltimoContato) <= -3);
      if (stale.length === 0) return "Nenhum lead está há mais de 3 dias sem contato.";
      return `${stale.length} lead(s) sem contato há 3+ dias:\n${stale.map((l) => `• ${l.nome} (${l.empresa ?? "—"}) — último contato há ${Math.abs(daysFromToday(l.dataUltimoContato))} dias`).join("\n")}`;
    }

    if (q.includes("fiscal") && q.includes("pend")) {
      const pend = obligations.filter((o) => o.status === "Em atraso" || o.status === "Aguardando informação");
      if (pend.length === 0) return "Nenhuma empresa possui pendências no Fiscal no momento.";
      const set = new Set(pend.map((o) => clients.find((c) => c.id === o.clienteId)?.dados.nomeFantasia));
      return `Empresas com pendências no Fiscal:\n${Array.from(set).map((n) => `• ${n}`).join("\n")}`;
    }

    if (q.includes("vend") || q.includes("fechad")) {
      const fechados = leads.filter((l) => l.stage === "Fechado");
      const total = fechados.reduce((a, l) => a + l.valorEstimado, 0);
      return `Este mês fechamos ${fechados.length} negócio(s), somando ${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} em mensalidades recorrentes.`;
    }

    return "Ainda não sei responder essa pergunta específica — mas já consigo consultar tarefas atrasadas, certificados a vencer, inadimplência, leads parados e pendências fiscais. Tente uma das sugestões abaixo!";
  }

  function send(text: string) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }, { role: "ia", text: answer(text) }]);
    setInput("");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Eleven IA"
        description="Assistente inteligente com acesso aos dados autorizados da plataforma."
        actions={<Badge variant="cream">Beta</Badge>}
      />

      <Card>
        <CardContent className="flex h-[520px] flex-col p-0">
          <div className="flex-1 space-y-3 overflow-y-auto p-5 scrollbar-thin">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-xs ${
                    m.role === "user" ? "bg-wine-700 text-cream-50" : "bg-sand-100 text-sand-800"
                  }`}
                >
                  {m.role === "ia" && (
                    <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-wine-600">
                      <Sparkles className="size-3" /> Eleven IA
                    </span>
                  )}
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-sand-200 p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-sand-200 px-2.5 py-1 text-[10px] text-sand-600 hover:border-wine-300 hover:text-wine-700"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex gap-2"
            >
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pergunte algo sobre a operação da Eleven…" />
              <Button type="submit" size="icon"><Send className="size-4" /></Button>
            </form>
            <p className="mt-2 flex items-center gap-1 text-[10px] text-sand-400">
              <Shield className="size-3" /> A IA nunca altera dados críticos sem confirmação do usuário.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
