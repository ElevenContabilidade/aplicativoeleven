"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Check, FileWarning } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { parseOfx, type OfxTransacao } from "@/lib/ofx-parser";
import { pendenciasEmAberto, sugerirCorrespondencias } from "@/lib/conciliacao";
import { formatCurrency, formatDate } from "@/lib/utils";

const SEM_CORRESPONDENCIA = "__nenhuma__";

export default function ConciliacaoBancariaPage() {
  const router = useRouter();
  const clients = useAppStore((s) => s.clients);
  const recebimentos = useAppStore((s) => s.recebimentos);
  const boletosMensais = useAppStore((s) => s.boletosMensais);
  const recebimentosParceiro = useAppStore((s) => s.recebimentosParceiro);
  const updateHistoricoCliente = useAppStore((s) => s.updateHistoricoCliente);
  const updateRecebimento = useAppStore((s) => s.updateRecebimento);
  const updateBoleto = useAppStore((s) => s.updateBoleto);
  const updateRecebimentoParceiro = useAppStore((s) => s.updateRecebimentoParceiro);

  const [transacoes, setTransacoes] = useState<OfxTransacao[]>([]);
  const [selecoes, setSelecoes] = useState<Map<string, string | null>>(new Map());
  const [confirmados, setConfirmados] = useState<Set<string>>(new Set());
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);

  const pendencias = useMemo(
    () => pendenciasEmAberto(clients, recebimentos, boletosMensais, recebimentosParceiro),
    [clients, recebimentos, boletosMensais, recebimentosParceiro]
  );
  const pendenciasPorKey = useMemo(() => new Map(pendencias.map((p) => [p.key, p])), [pendencias]);

  async function handleArquivo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErroArquivo(null);
    try {
      const texto = await file.text();
      const trans = parseOfx(texto);
      if (trans.length === 0) {
        setErroArquivo("Não encontrei transações nesse arquivo. Confirme se é um extrato exportado no formato OFX.");
        setTransacoes([]);
        return;
      }
      setNomeArquivo(file.name);
      setTransacoes(trans);
      setSelecoes(sugerirCorrespondencias(trans, pendencias));
      setConfirmados(new Set());
    } catch {
      setErroArquivo("Não consegui ler esse arquivo.");
    } finally {
      e.target.value = "";
    }
  }

  const creditos = useMemo(() => transacoes.filter((t) => t.tipo !== "DEBIT" && t.valor > 0), [transacoes]);
  const totalSugerido = creditos.filter((t) => selecoes.get(t.fitId) && !confirmados.has(t.fitId)).length;

  function confirmarLinha(t: OfxTransacao) {
    const key = selecoes.get(t.fitId);
    if (!key) return;
    const p = pendenciasPorKey.get(key);
    if (!p) return;
    if (p.origem === "cliente" && p.clienteId) {
      updateHistoricoCliente(p.clienteId, p.refId, { status: "Pago", pagamento: t.data });
    } else if (p.origem === "avulso") {
      updateRecebimento(p.refId, { status: "Pago", pagamento: t.data });
    } else if (p.origem === "boleto" && p.clienteId) {
      updateBoleto(p.clienteId, p.refId, { recebido: true, dataRecebimento: t.data, valorRecebido: t.valor });
    } else if (p.origem === "parceiro" && p.clienteId) {
      updateRecebimentoParceiro(p.clienteId, p.refId, { status: "Pago", dataPagamento: t.data });
    }
    setConfirmados((prev) => new Set(prev).add(t.fitId));
  }

  function confirmarTodasSugeridas() {
    for (const t of creditos) {
      if (selecoes.get(t.fitId) && !confirmados.has(t.fitId)) confirmarLinha(t);
    }
  }

  return (
    <div>
      <button onClick={() => router.push("/financeiro")} className="mb-4 flex items-center gap-1.5 text-xs font-medium text-sand-500 hover:text-wine-700">
        <ArrowLeft className="size-3.5" /> Voltar pro Financeiro
      </button>

      <PageHeader
        title="Conciliação bancária"
        description="Importe o extrato do banco (OFX) e bata automaticamente com os honorários, boletos e recebimentos em aberto."
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <label className="flex cursor-pointer items-center gap-2 rounded-md bg-wine-600 px-3 py-2 text-xs font-semibold text-white hover:bg-wine-700">
            <Upload className="size-3.5" /> Escolher extrato (.ofx)
            <input type="file" accept=".ofx,.qfx" onChange={handleArquivo} className="hidden" />
          </label>
          {nomeArquivo && <span className="text-xs text-sand-500">Arquivo: {nomeArquivo}</span>}
          <p className="w-full text-xs text-sand-400 sm:w-auto">
            Exporte o extrato em OFX direto do internet banking do seu banco — praticamente todos oferecem essa opção.
          </p>
        </CardContent>
      </Card>

      {erroArquivo && (
        <p className="mb-4 flex items-center gap-1.5 rounded-md bg-status-danger-bg px-3 py-2 text-xs text-status-danger">
          <FileWarning className="size-3.5" /> {erroArquivo}
        </p>
      )}

      {creditos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Transações do extrato — {creditos.length} créditos, {totalSugerido} com sugestão automática
            </CardTitle>
            <Button size="sm" onClick={confirmarTodasSugeridas} disabled={totalSugerido === 0}>
              <Check className="size-3.5" /> Confirmar todas as sugeridas
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição do banco</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Corresponde a</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditos.map((t) => {
                  const key = selecoes.get(t.fitId) ?? SEM_CORRESPONDENCIA;
                  const confirmado = confirmados.has(t.fitId);
                  return (
                    <TableRow key={t.fitId}>
                      <TableCell className="whitespace-nowrap">{formatDate(t.data)}</TableCell>
                      <TableCell className="max-w-56 truncate text-sand-500" title={t.descricao}>
                        {t.descricao || "—"}
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(t.valor)}</TableCell>
                      <TableCell>
                        {confirmado ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-status-success">
                            <Check className="size-3.5" /> Conciliado
                          </span>
                        ) : (
                          <Select
                            value={key}
                            onValueChange={(v) => setSelecoes((prev) => new Map(prev).set(t.fitId, v === SEM_CORRESPONDENCIA ? null : v))}
                          >
                            <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value={SEM_CORRESPONDENCIA}>Sem correspondência</SelectItem>
                              {pendencias.map((p) => (
                                <SelectItem key={p.key} value={p.key}>
                                  {p.nome} — {formatCurrency(p.valor)} ({p.competencia})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        {!confirmado && (
                          <Button size="sm" variant="outline" disabled={key === SEM_CORRESPONDENCIA} onClick={() => confirmarLinha(t)}>
                            Confirmar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {transacoes.length > 0 && creditos.length === 0 && (
        <p className="py-8 text-center text-xs text-sand-400">
          O arquivo foi lido, mas não encontrei transações de crédito (entrada de dinheiro) nele.
        </p>
      )}
    </div>
  );
}
