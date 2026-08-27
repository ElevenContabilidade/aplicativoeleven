"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Phone, MessageSquare, Users as UsersIcon, Mail, ClipboardList, ListTodo, FileText, GitBranch, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { teamName } from "@/lib/data/seed";
import type { TimelineEvent } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const ICONS: Record<TimelineEvent["tipo"], typeof Phone> = {
  ligacao: Phone,
  mensagem: MessageSquare,
  reuniao: UsersIcon,
  email: Mail,
  solicitacao: ClipboardList,
  tarefa: ListTodo,
  documento: FileText,
  crm: GitBranch,
};

export default function AtendimentoPage() {
  const timeline = useAppStore((s) => s.timeline);
  const clients = useAppStore((s) => s.clients);
  const addTimelineEvent = useAppStore((s) => s.addTimelineEvent);
  const { userId } = useAuthStore();

  const searchParams = useSearchParams();
  const router = useRouter();

  const [clienteFiltro, setClienteFiltro] = useState("Todos");
  const [open, setOpen] = useState(() => searchParams.get("novo") === "1");
  const [clienteId, setClienteId] = useState(clients[0]?.id ?? "");
  const [tipo, setTipo] = useState<TimelineEvent["tipo"]>("ligacao");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    if (searchParams.get("novo") === "1") router.replace("/atendimento");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(
    () => [...timeline].filter((t) => clienteFiltro === "Todos" || t.clienteId === clienteFiltro).sort((a, b) => b.data.localeCompare(a.data)),
    [timeline, clienteFiltro]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim() || !clienteId) return;
    addTimelineEvent({
      id: `tl-${Date.now()}`,
      clienteId,
      data: new Date().toISOString().slice(0, 10),
      autor: teamName(userId ?? ""),
      tipo,
      descricao,
    });
    setDescricao("");
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Atendimento"
        description="Linha do tempo consolidada de todos os atendimentos e movimentações com clientes."
        actions={<Button onClick={() => setOpen(true)}><Plus className="size-3.5" /> Novo atendimento</Button>}
      />

      <div className="mb-4">
        <Select value={clienteFiltro} onValueChange={setClienteFiltro}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os clientes</SelectItem>
            {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.dados.nomeFantasia ?? c.dados.razaoSocial}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          {sorted.map((t) => {
            const client = clients.find((c) => c.id === t.clienteId);
            const Icon = ICONS[t.tipo];
            return (
              <div key={t.id} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-wine-100 text-wine-700">
                  <Icon className="size-3.5" />
                </span>
                <div>
                  <p className="text-sm text-sand-800">{t.descricao}</p>
                  <p className="text-[11px] text-sand-400">
                    {client?.dados.nomeFantasia ?? client?.dados.razaoSocial} • {formatDateTime(t.data)} • {t.autor}
                  </p>
                </div>
              </div>
            );
          })}
          {sorted.length === 0 && <p className="py-8 text-center text-xs text-sand-400">Nenhum atendimento registrado.</p>}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo atendimento</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label className="mb-1 block">Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.dados.nomeFantasia ?? c.dados.razaoSocial}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TimelineEvent["tipo"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ligacao">Ligação</SelectItem>
                  <SelectItem value="mensagem">Mensagem</SelectItem>
                  <SelectItem value="reuniao">Reunião</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="solicitacao">Solicitação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Descrição</Label>
              <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">Registrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
