"use client";

import { useMemo, useState } from "react";
import { FileSignature, Send, RefreshCw, ExternalLink, Trash2, CheckCircle2, XCircle, Clock3, FlaskConical, Plus, X, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import type { Client, ContratoAssinatura, StatusAssinatura } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const STATUS_STYLE: Record<StatusAssinatura, { label: string; className: string }> = {
  Enviado: { label: "Aguardando assinatura", className: "bg-status-warning-bg text-status-warning" },
  Assinado: { label: "Assinado", className: "bg-status-success-bg text-status-success" },
  Recusado: { label: "Recusado", className: "bg-status-danger-bg text-status-danger" },
  Erro: { label: "Erro no envio", className: "bg-status-danger-bg text-status-danger" },
};

function derivaStatus(contrato: ContratoAssinatura): StatusAssinatura {
  if (contrato.signatarios.some((s) => s.recusado)) return "Recusado";
  if (contrato.signatarios.length > 0 && contrato.signatarios.every((s) => s.assinado)) return "Assinado";
  return "Enviado";
}

export function ContratoAssinaturaCard({ client }: { client: Client }) {
  const contratosAssinatura = useAppStore((s) => s.contratosAssinatura);
  const addContratoAssinatura = useAppStore((s) => s.addContratoAssinatura);
  const updateContratoAssinatura = useAppStore((s) => s.updateContratoAssinatura);
  const deleteContratoAssinatura = useAppStore((s) => s.deleteContratoAssinatura);

  const team = useAppStore((s) => s.team);
  const dadosEscritorio = useAppStore((s) => s.dadosEscritorio);
  const { userId } = useAuthStore();

  const contratos = useMemo(
    () => contratosAssinatura.filter((c) => c.clienteId === client.id).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
    [contratosAssinatura, client.id]
  );

  const linhasIniciais = useMemo(() => {
    const doSocios = client.socios.map((s) => ({ id: s.id, nome: s.nome, email: s.email ?? "", incluir: true, tag: "" }));

    const colaboradorLogado = team.find((m) => m.id === userId);
    const representanteEscritorio = colaboradorLogado
      ? { id: `escritorio-${colaboradorLogado.id}`, nome: colaboradorLogado.nome, email: colaboradorLogado.email, incluir: true, tag: "Eleven Contabilidade" }
      : dadosEscritorio.email
        ? { id: "escritorio-generico", nome: dadosEscritorio.razaoSocial || dadosEscritorio.nomeFantasia, email: dadosEscritorio.email, incluir: true, tag: "Eleven Contabilidade" }
        : null;

    const linhas = doSocios.length > 0 ? doSocios : [{ id: "manual-1", nome: "", email: "", incluir: true, tag: "" }];
    return representanteEscritorio ? [...linhas, representanteEscritorio] : linhas;
  }, [client.socios, team, userId, dadosEscritorio]);

  const [file, setFile] = useState<File | null>(null);
  const [linhasSignatarios, setLinhasSignatarios] = useState(linhasIniciais);
  const [sandbox, setSandbox] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [naoConfigurado, setNaoConfigurado] = useState(false);

  const signatariosSelecionados = linhasSignatarios.filter((l) => l.incluir && l.nome.trim() && l.email.trim());

  function atualizarLinha(id: string, patch: Partial<{ nome: string; email: string; incluir: boolean }>) {
    setLinhasSignatarios((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function adicionarLinha() {
    setLinhasSignatarios((prev) => [...prev, { id: `manual-${Date.now()}`, nome: "", email: "", incluir: true, tag: "" }]);
  }
  function removerLinha(id: string) {
    setLinhasSignatarios((prev) => prev.filter((l) => l.id !== id));
  }

  async function enviarContrato() {
    if (!file || signatariosSelecionados.length === 0) return;
    setEnviando(true);
    setErroEnvio(null);
    setNaoConfigurado(false);
    try {
      const form = new FormData();
      form.append("nomeDocumento", `Contrato de prestação de serviço — ${client.dados.razaoSocial || client.dados.nomeFantasia}`);
      form.append(
        "signatarios",
        JSON.stringify(signatariosSelecionados.map((s) => ({ nome: s.nome.trim(), email: s.email.trim() })))
      );
      form.append("sandbox", String(sandbox));
      form.append("arquivo", file, file.name);

      const res = await fetch("/api/assinaturas/enviar", { method: "POST", body: form });
      const json = await res.json();

      if (!json.configured) {
        setNaoConfigurado(true);
        return;
      }
      if (!json.sent) {
        setErroEnvio(json.error ?? "Não foi possível enviar o contrato.");
        return;
      }

      const agora = new Date().toISOString();
      const contrato: ContratoAssinatura = {
        id: `contrato-${Date.now()}`,
        clienteId: client.id,
        nomeArquivo: file.name,
        documentId: json.documentId,
        status: "Enviado",
        sandbox,
        signatarios: (json.signatures ?? []).map((sig: { publicId?: string; nome: string; email: string; link?: string }, i: number) => ({
          publicId: sig.publicId,
          nome: sig.nome || signatariosSelecionados[i]?.nome || "",
          email: sig.email || signatariosSelecionados[i]?.email || "",
          assinado: false,
          recusado: false,
          linkAssinatura: sig.link,
        })),
        criadoEm: agora,
        atualizadoEm: agora,
      };
      addContratoAssinatura(contrato);
      setFile(null);
    } catch (err) {
      setErroEnvio(err instanceof Error ? err.message : "Erro desconhecido ao enviar.");
    } finally {
      setEnviando(false);
    }
  }

  async function atualizarStatus(contrato: ContratoAssinatura) {
    setAtualizandoId(contrato.id);
    try {
      const res = await fetch("/api/assinaturas/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: contrato.documentId }),
      });
      const json = await res.json();
      if (!json.configured || !json.ok) {
        updateContratoAssinatura(contrato.id, { erro: json.error ?? "Não configurado.", atualizadoEm: new Date().toISOString() });
        return;
      }
      // A Autentique também retorna o criador do documento nessa lista (com ação
      // "Criou o documento", não uma assinatura pendente de verdade) — filtra
      // pra manter só quem a gente convidou pra assinar no envio original.
      const emailsConvidados = new Set(contrato.signatarios.map((s) => s.email.toLowerCase()));
      const signatarios = json.signatures
        .filter((sig: { email: string }) => emailsConvidados.has(sig.email.toLowerCase()))
        .map((sig: { publicId?: string; nome: string; email: string; link?: string; assinado: boolean; dataAssinatura?: string; recusado: boolean }) => ({
          publicId: sig.publicId,
          nome: sig.nome,
          email: sig.email,
          assinado: sig.assinado,
          dataAssinatura: sig.dataAssinatura,
          recusado: sig.recusado,
          linkAssinatura: sig.link,
        }));
      const atualizado: ContratoAssinatura = { ...contrato, signatarios };
      updateContratoAssinatura(contrato.id, {
        signatarios,
        status: derivaStatus(atualizado),
        pdfAssinadoUrl: json.pdfAssinadoUrl,
        erro: undefined,
        atualizadoEm: new Date().toISOString(),
      });
    } catch (err) {
      updateContratoAssinatura(contrato.id, {
        erro: err instanceof Error ? err.message : "Erro desconhecido.",
        atualizadoEm: new Date().toISOString(),
      });
    } finally {
      setAtualizandoId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="size-4 text-wine-600" /> Contrato de prestação de serviço
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="rounded-lg border border-dashed border-sand-300 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-sand-500">Enviar novo contrato para assinatura</p>
          <div>
            <Label className="mb-1 block">Arquivo do contrato (PDF) *</Label>
            <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>

          <div className="mt-3">
            <Label className="mb-1.5 block">Signatários (marque quem precisa assinar) *</Label>
            <div className="space-y-2">
              {linhasSignatarios.map((linha) => (
                <div key={linha.id} className="flex items-center gap-2">
                  <Checkbox checked={linha.incluir} onCheckedChange={(v) => atualizarLinha(linha.id, { incluir: v === true })} />
                  <Input
                    value={linha.nome}
                    onChange={(e) => atualizarLinha(linha.id, { nome: e.target.value })}
                    placeholder="Nome completo"
                    className="flex-1"
                  />
                  <Input
                    type="email"
                    value={linha.email}
                    onChange={(e) => atualizarLinha(linha.id, { email: e.target.value })}
                    placeholder="email@cliente.com"
                    className="flex-1"
                  />
                  {linha.tag && (
                    <span className="hidden shrink-0 whitespace-nowrap rounded-full bg-wine-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-wine-600 sm:inline">
                      {linha.tag}
                    </span>
                  )}
                  <button
                    type="button"
                    title="Remover"
                    onClick={() => removerLinha(linha.id)}
                    className="flex size-7 shrink-0 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={adicionarLinha}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-wine-600 hover:underline"
            >
              <Plus className="size-3.5" /> Adicionar signatário
            </button>
          </div>

          <label className="mt-3 flex items-center gap-2 text-xs text-sand-500">
            <Checkbox checked={sandbox} onCheckedChange={(v) => setSandbox(v === true)} />
            <span className="flex items-center gap-1">
              <FlaskConical className="size-3.5" /> Modo teste (sandbox) — não consome crédito, documento é apagado pela Autentique em alguns dias
            </span>
          </label>
          {naoConfigurado && (
            <p className="mt-3 rounded-md bg-status-warning-bg px-3 py-2 text-xs text-status-warning">
              Integração com a Autentique ainda não configurada — falta a variável de ambiente <code>AUTENTIQUE_API_TOKEN</code>.
            </p>
          )}
          {erroEnvio && <p className="mt-3 rounded-md bg-status-danger-bg px-3 py-2 text-xs text-status-danger">{erroEnvio}</p>}
          <div className="mt-3 flex justify-end">
            <Button size="sm" disabled={!file || signatariosSelecionados.length === 0 || enviando} onClick={enviarContrato}>
              <Send className="size-3.5" /> {enviando ? "Enviando..." : "Enviar para assinatura"}
            </Button>
          </div>
        </div>

        {contratos.length === 0 ? (
          <p className="py-4 text-center text-xs text-sand-400">Nenhum contrato enviado para assinatura ainda.</p>
        ) : (
          <div className="space-y-3">
            {contratos.map((contrato) => {
              const st = STATUS_STYLE[contrato.status];
              return (
                <div key={contrato.id} className="rounded-lg border border-sand-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-sand-800">
                        {contrato.nomeArquivo}
                        {contrato.sandbox && <span className="ml-1.5 text-[10px] font-semibold uppercase text-sand-400">(teste)</span>}
                      </p>
                      <p className="text-[11px] text-sand-400">Enviado em {formatDateTime(contrato.criadoEm)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${st.className}`}>{st.label}</span>
                      <button
                        type="button"
                        title="Atualizar status"
                        onClick={() => atualizarStatus(contrato)}
                        disabled={atualizandoId === contrato.id}
                        className="flex size-6 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-sand-700"
                      >
                        <RefreshCw className={`size-3.5 ${atualizandoId === contrato.id ? "animate-spin" : ""}`} />
                      </button>
                      <button
                        type="button"
                        title="Excluir rastreio"
                        onClick={() => confirm("Excluir o rastreio deste envio? Isso não cancela o documento na Autentique.") && deleteContratoAssinatura(contrato.id)}
                        className="flex size-6 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  {contrato.erro && <p className="mt-2 text-[11px] text-status-danger">{contrato.erro}</p>}
                  {contrato.status === "Assinado" && contrato.pdfAssinadoUrl && (
                    <a
                      href={contrato.pdfAssinadoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 flex w-fit items-center gap-1.5 rounded-md bg-status-success-bg px-2 py-1 text-xs font-medium text-status-success hover:underline"
                    >
                      <Download className="size-3.5" /> Baixar PDF assinado
                    </a>
                  )}
                  <div className="mt-2 space-y-1.5">
                    {contrato.signatarios.map((sig, i) => (
                      <div key={sig.publicId ?? i} className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-1.5 text-sand-700">
                          {sig.recusado ? (
                            <XCircle className="size-3.5 text-status-danger" />
                          ) : sig.assinado ? (
                            <CheckCircle2 className="size-3.5 text-status-success" />
                          ) : (
                            <Clock3 className="size-3.5 text-status-warning" />
                          )}
                          {sig.nome} <span className="text-sand-400">({sig.email})</span>
                        </span>
                        {!sig.assinado && sig.linkAssinatura && (
                          <a href={sig.linkAssinatura} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-wine-600 hover:underline">
                            Link de assinatura <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
