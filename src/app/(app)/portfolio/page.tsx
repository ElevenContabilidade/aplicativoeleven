"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Tag, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";

type SortColumn = "nome" | "valor";

function SortableHead({
  label,
  column,
  sort,
  onSort,
  className,
}: {
  label: string;
  column: SortColumn;
  sort: { column: SortColumn; direction: "asc" | "desc" } | null;
  onSort: (column: SortColumn) => void;
  className?: string;
}) {
  const active = sort?.column === column;
  const Icon = active ? (sort!.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "flex items-center gap-1 uppercase tracking-wide hover:text-wine-700",
          active && "text-wine-700"
        )}
      >
        {label}
        <Icon className={cn("size-3", !active && "text-sand-300")} />
      </button>
    </TableHead>
  );
}

export default function PortfolioPage() {
  const servicosPortfolio = useAppStore((s) => s.servicosPortfolio);
  const addServicoPortfolio = useAppStore((s) => s.addServicoPortfolio);
  const updateServicoPortfolio = useAppStore((s) => s.updateServicoPortfolio);
  const deleteServicoPortfolio = useAppStore((s) => s.deleteServicoPortfolio);

  const [novoNome, setNovoNome] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [sort, setSort] = useState<{ column: SortColumn; direction: "asc" | "desc" } | null>(null);

  function toggleSort(column: SortColumn) {
    setSort((s) => (s?.column === column ? { column, direction: s.direction === "asc" ? "desc" : "asc" } : { column, direction: "asc" }));
  }

  const servicosOrdenados = useMemo(() => {
    if (!sort) return servicosPortfolio;
    const dir = sort.direction === "asc" ? 1 : -1;
    return [...servicosPortfolio].sort((a, b) => {
      if (sort.column === "nome") return a.nome.localeCompare(b.nome, "pt-BR") * dir;
      return (a.valor - b.valor) * dir;
    });
  }, [servicosPortfolio, sort]);

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
                <SortableHead label="Serviço" column="nome" sort={sort} onSort={toggleSort} />
                <SortableHead label="Valor (R$)" column="valor" sort={sort} onSort={toggleSort} className="w-40" />
                <TableHead className="w-14" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicosOrdenados.map((sp) => (
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
              {servicosOrdenados.length === 0 && (
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
