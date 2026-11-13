"use client";

import { useState } from "react";
import { Trash2, UserPlus, FileUp, Paperclip } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/team-lookup";
import {
  CHECKLIST_STATUS,
  nomesParceirosConhecidos,
  type ChecklistStatus,
  type PagamentoProcesso,
  type ProcessoSocietario,
  type ProcessoSocietarioStatus,
} from "@/lib/types";
import { CHECKLISTS_POR_TIPO, etapasAtualizadas } from "@/lib/societario-checklist";
import { criarClienteAvulso, nomeDoProcessoSocietario } from "@/lib/processo-societario";
import { uploadAnexoSocietario } from "@/lib/upload-anexo-societario";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const STATUSES: ProcessoSocietarioStatus[] = ["Solicitado", "Documentação", "Protocolo", "Em análise", "Exigência", "Aprovado", "Finalizado"];

const PAGAMENTO_OPCOES: PagamentoProcesso[] = ["Pago", "Parcial", "Pendente"];
const PAGAMENTO_STYLE: Record<PagamentoProcesso, string> = {
  Pago: "border-status-success bg-status-success-bg text-status-success",
  Parcial: "border-status-warning bg-status-warning-bg text-status-warning",
  Pendente: "border-status-danger bg-status-danger-bg text-status-danger",
};

const ETAPA_STATUS_STYLE: Record<ChecklistStatus, string> = {
  OK: "border-status-success bg-status-success-bg text-status-success",
  Pendente: "border-status-danger bg-status-danger-bg text-status-danger",
  "Em andamento": "border-status-warning bg-status-warning-bg text-status-warning",
  Dispensada: "border-status-brown bg-status-brown-bg text-status-brown",
};

function isDone(status: ChecklistStatus) {
  return status === "OK" || status === "Dispensada";
}

export function ProcessoDetailDialog({ processo, onClose }: { processo: ProcessoSocietario | null; onClose: () => void }) {
  const clients = useAppStore((s) => s.clients);
  const team = useAppStore((s) => s.team);
  const extrasParceiro = useAppStore((s) => s.extrasParceiro);
  const processosSocietarios = useAppStore((s) => s.processosSocietarios);
  const updateProcessoSocietario = useAppStore((s) => s.updateProcessoSocietario);
  const addClient = useAppStore((s) => s.addClient);
  const addEtapaProcesso = useAppStore((s) => s.addEtapaProcesso);
  const setEtapaStatus = useAppStore((s) => s.setEtapaStatus);
  const deleteEtapaProcesso = useAppStore((s) => s.deleteEtapaProcesso);

  const [descricao, setDescricao] = useState("");
  const [responsavelId, setResponsavelId] = useState(team[0]?.id ?? "");
  const [inicio, setInicio] = useState(new Date().toISOString().slice(0, 10));
  const [prazo, setPrazo] = useState(new Date().toISOString().slice(0, 10));
  const [enviandoAnexo, setEnviandoAnexo] = useState(false);
  const [erroAnexo, setErroAnexo] = useState<string | null>(null);

  if (!processo) return null;
  const client = clients.find((c) => c.id === processo.clienteId);
  const etapas = processo.etapas ?? [];
  const feitas = etapas.filter((e) => isDone(e.status)).length;
  const checklistPadrao = CHECKLISTS_POR_TIPO[processo.tipoServico];
  const bancoOptions = [...new Set(processosSocietarios.map((p) => p.banco).filter((b): b is string => !!b))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
  const parceiroOptions = nomesParceirosConhecidos(clients, extrasParceiro);
  const checklistDesatualizado = !!checklistPadrao && checklistPadrao.etapas.length !== etapas.length;

  function sincronizarChecklist() {
    if (!processo) return;
    const hoje = new Date().toISOString().slice(0, 10);
    updateProcessoSocietario(processo.id, {
      etapas: etapasAtualizadas(processo.tipoServico, processo.etapas, processo.responsavelId, hoje, processo.prazo ?? hoje),
    });
  }

  /** Promove um processo avulso (sem cadastro de cliente) pra cliente de
   * verdade — cria o cadastro rápido (status Onboarding) e vincula o
   * processo a ele. Só acontece quando alguém clica aqui, nunca sozinho. */
  function virarCliente() {
    if (!processo) return;
    const hoje = new Date().toISOString().slice(0, 10);
    const novoCliente = criarClienteAvulso(nomeDoProcessoSocietario(processo, clients), processo.responsavelId, hoje, processo.parceiro);
    addClient(novoCliente);
    updateProcessoSocietario(processo.id, { clienteId: novoCliente.id, clienteNomeAvulso: undefined });
  }

  function addEtapa() {
    if (!descricao.trim() || !processo) return;
    addEtapaProcesso(processo.id, { id: `et-${Date.now()}`, descricao, responsavelId, inicio, prazo, status: "Pendente" });
    setDescricao("");
  }

  async function handleAnexarDocumento(file: File | null) {
    if (!file || !processo) return;
    setEnviandoAnexo(true);
    setErroAnexo(null);
    try {
      const anexo = await uploadAnexoSocietario({
        file,
        processoId: processo.id,
        processoNome: nomeDoProcessoSocietario(processo, clients),
      });
      updateProcessoSocietario(processo.id, {
        anexos: [...(processo.anexos ?? []), { id: `anexo-${Date.now()}`, nome: anexo.nome, url: anexo.url, enviadoEm: new Date().toISOString().slice(0, 10) }],
      });
    } catch (err) {
      setErroAnexo(err instanceof Error ? err.message : "Não foi possível enviar o documento.");
    } finally {
      setEnviandoAnexo(false);
    }
  }

  function removerAnexo(anexoId: string) {
    if (!processo) return;
    if (!confirm("Remover esse anexo da lista? O arquivo continua salvo no Drive.")) return;
    updateProcessoSocietario(processo.id, { anexos: (processo.anexos ?? []).filter((a) => a.id !== anexoId) });
  }

  return (
    <Dialog open={!!processo} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{processo.tipoServico}</DialogTitle>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-sand-500">
              {client ? `${client.dados.razaoSocial} • ${client.dados.cnpj || "sem CNPJ"}` : nomeDoProcessoSocietario(processo, clients)}
            </p>
            {!client && (
              <Button type="button" size="sm" variant="outline" onClick={virarCliente} className="h-6 gap-1 px-2 text-[11px]">
                <UserPlus className="size-3" /> Virou cliente
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          {processo.orgao && <Badge variant="outline">{processo.orgao}</Badge>}
          {processo.protocolo && <Badge variant="cream">Nº {processo.protocolo}</Badge>}
          {processo.parceiro && <Badge variant="outline">Parceiro: {processo.parceiro}</Badge>}
          {!!processo.valorProcesso && <Badge variant="cream">{formatCurrency(processo.valorProcesso)}</Badge>}
          {processo.pagamento && (
            <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase", PAGAMENTO_STYLE[processo.pagamento])}>
              {processo.pagamento}
              {processo.pagamento === "Parcial" && !!processo.valorPago && ` · ${formatCurrency(processo.valorPago)}`}
            </span>
          )}
          <span className="text-xs text-sand-400">
            Iniciado em {formatDate(processo.dataAbertura)}
            {processo.prazo ? ` • Prazo ${formatDate(processo.prazo)}` : ""}
            {processo.dataConclusao ? ` • Concluído em ${formatDate(processo.dataConclusao)}` : ""}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block">Status</Label>
            <Select
              value={processo.status}
              onValueChange={(v) => {
                const status = v as ProcessoSocietarioStatus;
                updateProcessoSocietario(processo.id, {
                  status,
                  dataConclusao: status === "Finalizado" ? (processo.dataConclusao ?? new Date().toISOString().slice(0, 10)) : undefined,
                });
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block">Responsável</Label>
            <Select value={processo.responsavelId} onValueChange={(v) => updateProcessoSocietario(processo.id, { responsavelId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {team.map((m) => (<SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block">Número do processo</Label>
            <Input
              value={processo.protocolo ?? ""}
              onChange={(e) => updateProcessoSocietario(processo.id, { protocolo: e.target.value || undefined })}
              placeholder="Ex: JC-2209981"
            />
          </div>
          <div>
            <Label className="mb-1 block">Parceiro</Label>
            <Input
              value={processo.parceiro ?? ""}
              onChange={(e) => updateProcessoSocietario(processo.id, { parceiro: e.target.value || undefined })}
              placeholder="Quem indicou (se for o caso)"
              list="societario-parceiros"
            />
          </div>
          <div>
            <Label className="mb-1 block">Valor do processo (R$)</Label>
            <Input
              type="number"
              value={processo.valorProcesso ?? ""}
              onChange={(e) => updateProcessoSocietario(processo.id, { valorProcesso: Number(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
          <div>
            <Label className="mb-1 block">Pagamento</Label>
            <Select
              value={processo.pagamento ?? "Pendente"}
              onValueChange={(v) => {
                const pagamento = v as PagamentoProcesso;
                const hoje = new Date().toISOString().slice(0, 10);
                const temData = pagamento === "Pago" || pagamento === "Parcial";
                updateProcessoSocietario(processo.id, {
                  pagamento,
                  dataPagamento: temData ? (processo.dataPagamento ?? hoje) : undefined,
                  valorPago: pagamento === "Parcial" ? processo.valorPago : undefined,
                });
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAGAMENTO_OPCOES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          {(processo.pagamento === "Pago" || processo.pagamento === "Parcial") && (
            <div>
              <Label className="mb-1 block">Data do pagamento</Label>
              <Input
                type="date"
                value={processo.dataPagamento ?? ""}
                onChange={(e) => updateProcessoSocietario(processo.id, { dataPagamento: e.target.value })}
              />
            </div>
          )}
          {processo.pagamento === "Parcial" && (
            <div>
              <Label className="mb-1 block">Valor já pago (R$)</Label>
              <Input
                type="number"
                value={processo.valorPago ?? ""}
                onChange={(e) => updateProcessoSocietario(processo.id, { valorPago: Number(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          )}
          {(processo.pagamento === "Pago" || processo.pagamento === "Parcial") && (
            <div>
              <Label className="mb-1 block">Banco</Label>
              <Input
                value={processo.banco ?? ""}
                onChange={(e) => updateProcessoSocietario(processo.id, { banco: e.target.value })}
                placeholder="Em qual banco caiu"
                list="societario-bancos"
              />
            </div>
          )}
          {(processo.pagamento === "Pago" || processo.pagamento === "Parcial") && (
            <div>
              <Label className="mb-1 block">Tipo</Label>
              <Select
                value={processo.tipoPessoa ?? "—"}
                onValueChange={(v) => updateProcessoSocietario(processo.id, { tipoPessoa: v === "—" ? undefined : (v as "PF" | "PJ") })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="—">—</SelectItem>
                  <SelectItem value="PF">PF</SelectItem>
                  <SelectItem value="PJ">PJ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="col-span-2">
            <Label className="mb-1 block">Pendências / observações</Label>
            <Textarea
              value={processo.pendencias ?? processo.observacoes ?? ""}
              onChange={(e) => updateProcessoSocietario(processo.id, { pendencias: e.target.value })}
              className="min-h-16 text-xs"
            />
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-1.5 text-xs font-semibold text-sand-700">Documentos</p>
          <div className="space-y-1.5">
            {(processo.anexos ?? []).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-sand-200 bg-sand-50 px-3 py-1.5 text-xs">
                <a href={a.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-1.5 text-wine-700 hover:underline">
                  <Paperclip className="size-3.5 shrink-0" />
                  <span className="truncate">{a.nome}</span>
                </a>
                <div className="flex shrink-0 items-center gap-2 text-sand-400">
                  <span>{formatDate(a.enviadoEm)}</span>
                  <button type="button" onClick={() => removerAnexo(a.id)} title="Remover anexo" className="hover:text-status-danger">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-sand-300 bg-sand-50 px-3 py-2 text-xs text-sand-600 hover:border-wine-400 hover:bg-wine-50">
              <FileUp className="size-3.5 shrink-0 text-wine-500" />
              {enviandoAnexo ? "Enviando..." : "Clique para anexar um documento"}
              <input
                type="file"
                className="hidden"
                disabled={enviandoAnexo}
                onChange={(e) => {
                  handleAnexarDocumento(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
            </label>
            {erroAnexo && <p className="text-[11px] text-status-danger">{erroAnexo}</p>}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs font-semibold text-sand-700">Etapas do processo</p>
            <span className="text-[11px] text-sand-400">{feitas}/{etapas.length} concluídas</span>
          </div>
          {checklistPadrao && checklistDesatualizado && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-status-warning bg-status-warning-bg px-3 py-2 text-[11px] text-status-warning">
              <span>
                {etapas.length === 0
                  ? `Esse processo ainda não tem o checklist padrão de ${processo.tipoServico}.`
                  : `Esse processo foi criado com uma versão antiga do checklist padrão de ${processo.tipoServico}.`}
              </span>
              <button
                type="button"
                onClick={sincronizarChecklist}
                className="shrink-0 rounded-md border border-status-warning px-2 py-1 font-semibold hover:bg-status-warning hover:text-white"
              >
                {etapas.length === 0 ? "Aplicar checklist padrão" : "Atualizar checklist"}
              </button>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {etapas.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className={isDone(e.status) ? "text-sand-400 line-through" : "text-sand-800"}>{e.descricao}</TableCell>
                  <TableCell className="text-xs text-sand-500">{teamName(e.responsavelId)}</TableCell>
                  <TableCell className="text-xs text-sand-500">{formatDate(e.inicio)}</TableCell>
                  <TableCell className="text-xs text-sand-500">{formatDate(e.prazo)}</TableCell>
                  <TableCell>
                    <Select value={e.status} onValueChange={(v) => setEtapaStatus(processo.id, e.id, v as ChecklistStatus)}>
                      <SelectTrigger className={cn("h-7 w-36 justify-center whitespace-nowrap px-2 text-[11px] font-semibold uppercase", ETAPA_STATUS_STYLE[e.status])}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHECKLIST_STATUS.map((s) => (
                          <SelectItem key={s} value={s} className="uppercase">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => deleteEtapaProcesso(processo.id, e.id)}
                      title="Excluir etapa"
                      className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {etapas.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-4 text-center text-xs text-sand-400">Nenhuma etapa cadastrada.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-3 grid grid-cols-[1fr_auto_auto_auto_auto] items-end gap-2">
            <div>
              <Label className="mb-1 block">Nova etapa</Label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição da etapa" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="mb-1 block">Responsável</Label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {team.map((m) => (<SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Início</Label>
              <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="mb-1 block">Prazo</Label>
              <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className="h-8 text-xs" />
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addEtapa}>Adicionar</Button>
          </div>
        </div>
        <datalist id="societario-bancos">
          {bancoOptions.map((b) => (<option key={b} value={b} />))}
        </datalist>
        <datalist id="societario-parceiros">
          {parceiroOptions.map((p) => (<option key={p} value={p} />))}
        </datalist>
      </DialogContent>
    </Dialog>
  );
}
