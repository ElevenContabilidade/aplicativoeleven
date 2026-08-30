"use client";

import { useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";

export default function PortfolioPage() {
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

  return (
    <div>
      <PageHeader
        title="Portfólio"
        description="Tabela de preços dos serviços que a Eleven oferece."
      />

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
    </div>
  );
}
