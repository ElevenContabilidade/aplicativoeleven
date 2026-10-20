"use client";

import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store/app-store";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MESES } from "./crm-shared";

type SortColumn = "nome" | "etapa" | "mes" | "dia" | "cidade" | "estado" | "origem" | "servico";

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
        className={cn("flex items-center gap-1 uppercase tracking-wide hover:text-wine-700", active && "text-wine-700")}
      >
        {label}
        <Icon className={cn("size-3", !active && "text-sand-300")} />
      </button>
    </TableHead>
  );
}

/** Aba Geral: listagem completa dos leads (todos, não só do período do
 * seletor) em formato de tabela ordenável — número de linha, etapa, mês/dia
 * de entrada, localização, origem e serviço principal. */
export function CrmGeralTable() {
  const leads = useAppStore((s) => s.leads);
  const servicosPortfolio = useAppStore((s) => s.servicosPortfolio);
  const [sort, setSort] = useState<{ column: SortColumn; direction: "asc" | "desc" } | null>(null);

  function toggleSort(column: SortColumn) {
    setSort((s) => (s?.column === column ? { column, direction: s.direction === "asc" ? "desc" : "asc" } : { column, direction: "asc" }));
  }

  function servicoDoLead(l: Lead) {
    if (l.servicoPortfolioId) {
      const sp = servicosPortfolio.find((s) => s.id === l.servicoPortfolioId);
      if (sp) return sp.nome;
    }
    return l.servicosInteresse[0] ?? "—";
  }

  const linhas = useMemo(
    () =>
      leads.map((l) => ({
        lead: l,
        mes: Number(l.dataEntrada.slice(5, 7)),
        dia: Number(l.dataEntrada.slice(8, 10)),
        servico: servicoDoLead(l),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leads, servicosPortfolio]
  );

  const ordenadas = useMemo(() => {
    if (!sort) return [...linhas].sort((a, b) => b.lead.dataEntrada.localeCompare(a.lead.dataEntrada));
    const dir = sort.direction === "asc" ? 1 : -1;
    return [...linhas].sort((a, b) => {
      switch (sort.column) {
        case "nome":
          return a.lead.nome.localeCompare(b.lead.nome, "pt-BR") * dir;
        case "etapa":
          return a.lead.stage.localeCompare(b.lead.stage, "pt-BR") * dir;
        case "mes":
          return (a.mes - b.mes) * dir;
        case "dia":
          return (a.dia - b.dia) * dir;
        case "cidade":
          return a.lead.cidade.localeCompare(b.lead.cidade, "pt-BR") * dir;
        case "estado":
          return a.lead.estado.localeCompare(b.lead.estado, "pt-BR") * dir;
        case "origem":
          return a.lead.origem.localeCompare(b.lead.origem, "pt-BR") * dir;
        case "servico":
          return a.servico.localeCompare(b.servico, "pt-BR") * dir;
        default:
          return 0;
      }
    });
  }, [linhas, sort]);

  return (
    <Card>
      <CardContent className="pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Nº</TableHead>
              <SortableHead label="Nome" column="nome" sort={sort} onSort={toggleSort} />
              <SortableHead label="Etapa" column="etapa" sort={sort} onSort={toggleSort} />
              <SortableHead label="Mês" column="mes" sort={sort} onSort={toggleSort} className="w-20" />
              <SortableHead label="Dia" column="dia" sort={sort} onSort={toggleSort} className="w-16" />
              <SortableHead label="Cidade" column="cidade" sort={sort} onSort={toggleSort} />
              <SortableHead label="UF" column="estado" sort={sort} onSort={toggleSort} className="w-16" />
              <SortableHead label="Origem" column="origem" sort={sort} onSort={toggleSort} />
              <SortableHead label="Serviço" column="servico" sort={sort} onSort={toggleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordenadas.map((row, i) => (
              <TableRow key={row.lead.id}>
                <TableCell className="text-sand-400">{i + 1}</TableCell>
                <TableCell className="font-medium text-sand-900">{row.lead.nome}</TableCell>
                <TableCell>
                  <Badge variant={row.lead.stage === "Fechado" ? "wine" : row.lead.stage === "Perdido" ? "outline" : "cream"}>
                    {row.lead.stage}
                  </Badge>
                </TableCell>
                <TableCell>{MESES[row.mes - 1] ?? "—"}</TableCell>
                <TableCell>{row.dia}</TableCell>
                <TableCell>{row.lead.cidade}</TableCell>
                <TableCell>{row.lead.estado}</TableCell>
                <TableCell>{row.lead.origem}</TableCell>
                <TableCell className="truncate">{row.servico}</TableCell>
              </TableRow>
            ))}
            {ordenadas.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-sand-400">
                  Nenhum lead cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
