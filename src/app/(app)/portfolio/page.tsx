"use client";

import { useMemo, useState } from "react";
import { Repeat, Scale, ShieldCheck, Receipt, Plus, Trash2, Tag } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";
import { resumoFinanceiroSocietario } from "@/lib/societario-financeiro";
import { formatCurrency } from "@/lib/utils";

export default function PortfolioPage() {
  const clients = useAppStore((s) => s.clients);
  const processosSocietarios = useAppStore((s) => s.processosSocietarios);
  const certificados = useAppStore((s) => s.certificados);
  const servicosExtras = useAppStore((s) => s.servicosExtras);
  const servicosPortfolio = useAppStore((s) => s.servicosPortfolio);
  const addServicoPortfolio = useAppStore((s) => s.addServicoPortfolio);
  const updateServicoPortfolio = useAppStore((s) => s.updateServicoPortfolio);
  const deleteServicoPortfolio = useAppStore((s) => s.deleteServicoPortfolio);

  const [novoNome, setNovoNome] = useState("");
  const [novoValor, setNovoValor] = useState("");

  function handleAddServico() {
    const nome = novoNome.trim();
    const valor = Number(novoValor.replace(",", "."));
    if (!nome || !Number.isFinite(valor) || valor < 0) return;
    addServicoPortfolio({ id: `sp-${Date.now()}`, nome, valor });
    setNovoNome("");
    setNovoValor("");
  }

  function handleDeleteServico(id: string, nome: string) {
    if (confirm(`Excluir o serviço "${nome}" da tabela de preços?`)) {
      deleteServicoPortfolio(id);
    }
  }

  const ativos = useMemo(() => clients.filter((c) => c.status === "Ativo"), [clients]);
  const mrr = ativos.reduce((a, c) => a + c.financeiro.valorMensal, 0);

  const societario = useMemo(() => resumoFinanceiroSocietario(processosSocietarios), [processosSocietarios]);

  const certPorTipo = useMemo(() => {
    const map = new Map<string, { qtd: number; total: number }>();
    for (const c of certificados) {
      const entry = map.get(c.tipo) ?? { qtd: 0, total: 0 };
      entry.qtd += 1;
      entry.total += c.valor;
      map.set(c.tipo, entry);
    }
    return [...map.entries()].map(([tipo, v]) => ({ tipo, ...v })).sort((a, b) => b.total - a.total);
  }, [certificados]);

  const extrasPorServico = useMemo(() => {
    const map = new Map<string, { qtd: number; total: number; recebido: number }>();
    for (const s of servicosExtras) {
      const entry = map.get(s.servico) ?? { qtd: 0, total: 0, recebido: 0 };
      entry.qtd += 1;
      entry.total += s.valor;
      if (s.status === "Pago") entry.recebido += s.valor;
      map.set(s.servico, entry);
    }
    return [...map.entries()].map(([servico, v]) => ({ servico, ...v })).sort((a, b) => b.total - a.total);
  }, [servicosExtras]);

  const totalCertificados = certPorTipo.reduce((a, c) => a + c.total, 0);
  const totalExtras = extrasPorServico.reduce((a, e) => a + e.total, 0);

  return (
    <div>
      <PageHeader
        title="Portfólio"
        description="Valor de cada serviço que a Eleven oferece — o que é recorrente e o que é avulso."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Honorários mensais (MRR)" value={formatCurrency(mrr)} icon={Repeat} tone="wine" hint="recorrente" />
        <MetricCard label="Societário" value={formatCurrency(societario.total)} icon={Scale} hint="acumulado" />
        <MetricCard label="Certificados digitais" value={formatCurrency(totalCertificados)} icon={ShieldCheck} hint="acumulado" />
        <MetricCard label="Serviços extras" value={formatCurrency(totalExtras)} icon={Receipt} hint="acumulado" />
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="size-4 text-wine-700" />
              Tabela de preços dos serviços
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="w-40">Valor (R$)</TableHead>
                  <TableHead className="w-14" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicosPortfolio.map((sp) => (
                  <TableRow key={sp.id}>
                    <TableCell>
                      <Input
                        value={sp.nome}
                        onChange={(e) => updateServicoPortfolio(sp.id, { nome: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={sp.valor}
                        onChange={(e) => updateServicoPortfolio(sp.id, { valor: Number(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleDeleteServico(sp.id, sp.nome)}
                        className="rounded-md p-1.5 text-sand-400 transition-colors hover:bg-status-danger/10 hover:text-status-danger"
                        title="Excluir serviço"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {servicosPortfolio.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sand-400">
                      Nenhum serviço cadastrado.
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell>
                    <Input
                      placeholder="Novo serviço"
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddServico()}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={novoValor}
                      onChange={(e) => setNovoValor(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddServico()}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="outline" onClick={handleAddServico} title="Adicionar serviço">
                      <Plus className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Honorários mensais</CardTitle></CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Clientes ativos</TableHead>
                  <TableHead>Receita mensal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Contabilidade mensal (honorário recorrente)</TableCell>
                  <TableCell>{ativos.length}</TableCell>
                  <TableCell>{formatCurrency(mrr)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Societário</CardTitle></CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Processos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Recebido</TableHead>
                  <TableHead>A receber</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {societario.porServico.map((s) => (
                  <TableRow key={s.tipoServico}>
                    <TableCell className="font-medium">{s.tipoServico}</TableCell>
                    <TableCell>{s.qtd}</TableCell>
                    <TableCell>{formatCurrency(s.total)}</TableCell>
                    <TableCell className="text-status-success">{formatCurrency(s.recebido)}</TableCell>
                    <TableCell className="text-status-warning">{formatCurrency(s.aReceber)}</TableCell>
                  </TableRow>
                ))}
                {societario.porServico.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-sand-400">Nenhum processo societário com valor informado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Certificados digitais</CardTitle></CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Certificados</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certPorTipo.map((c) => (
                  <TableRow key={c.tipo}>
                    <TableCell className="font-medium">{c.tipo}</TableCell>
                    <TableCell>{c.qtd}</TableCell>
                    <TableCell>{formatCurrency(c.total)}</TableCell>
                  </TableRow>
                ))}
                {certPorTipo.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="py-8 text-center text-sand-400">Nenhum certificado cadastrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Serviços extras</CardTitle></CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Recebido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extrasPorServico.map((e) => (
                  <TableRow key={e.servico}>
                    <TableCell className="font-medium">{e.servico}</TableCell>
                    <TableCell>{e.qtd}</TableCell>
                    <TableCell>{formatCurrency(e.total)}</TableCell>
                    <TableCell className="text-status-success">{formatCurrency(e.recebido)}</TableCell>
                  </TableRow>
                ))}
                {extrasPorServico.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-sand-400">Nenhum serviço extra cadastrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
