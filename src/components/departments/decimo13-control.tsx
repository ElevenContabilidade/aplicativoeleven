"use client";

import { useMemo, useState } from "react";
import { Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";

const YEARS = Array.from({ length: 2034 - 2026 + 1 }, (_, i) => String(2026 + i));

function parcelaBadge(dataLimite: string, paga: boolean) {
  const hoje = new Date().toISOString().slice(0, 10);
  if (paga) return <span className="rounded-full bg-status-success-bg px-2 py-0.5 text-[10px] font-semibold uppercase text-status-success">Paga</span>;
  if (hoje > dataLimite) return <span className="rounded-full bg-status-danger-bg px-2 py-0.5 text-[10px] font-semibold uppercase text-status-danger">Atrasada</span>;
  return <span className="rounded-full bg-status-warning-bg px-2 py-0.5 text-[10px] font-semibold uppercase text-status-warning">Em aberto</span>;
}

export function Decimo13Control() {
  const clients = useAppStore((s) => s.clients);
  const funcionarios = useAppStore((s) => s.funcionarios);
  const updateDecimo13 = useAppStore((s) => s.updateDecimo13);

  const [ano, setAno] = useState(() => {
    const atual = new Date().getFullYear().toString();
    return YEARS.includes(atual) ? atual : YEARS[0];
  });

  const dataPrimeiraParcela = `${ano}-11-30`;
  const dataSegundaParcela = `${ano}-12-20`;

  const linhas = useMemo(() => {
    return funcionarios
      .filter((f) => f.ativo)
      .map((f) => {
        const cliente = clients.find((c) => c.id === f.clienteId);
        if (!cliente?.dados.possuiFuncionarios) return null;
        const registro = f.decimosTerceiros.find((d) => d.ano === ano) ?? {
          ano,
          primeiraParcelaPaga: false,
          segundaParcelaPaga: false,
        };
        return { funcionario: f, cliente, registro };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);
  }, [funcionarios, clients, ano]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Gift className="size-4 text-wine-600" /> Controle de 13º salário</CardTitle>
        <Select value={ano} onValueChange={setAno}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="overflow-x-auto pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Funcionário</TableHead>
              <TableHead>1ª parcela (30/11)</TableHead>
              <TableHead>2ª parcela (20/12)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map(({ funcionario: f, cliente, registro }) => (
              <TableRow key={f.id}>
                <TableCell className="text-sand-500">{cliente!.dados.nomeFantasia || cliente!.dados.razaoSocial}</TableCell>
                <TableCell className="font-medium text-sand-800">{f.nome}</TableCell>
                <TableCell>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={registro.primeiraParcelaPaga}
                      onCheckedChange={(v) => updateDecimo13(f.id, ano, { primeiraParcelaPaga: v === true })}
                    />
                    {parcelaBadge(dataPrimeiraParcela, registro.primeiraParcelaPaga)}
                  </label>
                </TableCell>
                <TableCell>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={registro.segundaParcelaPaga}
                      onCheckedChange={(v) => updateDecimo13(f.id, ano, { segundaParcelaPaga: v === true })}
                    />
                    {parcelaBadge(dataSegundaParcela, registro.segundaParcelaPaga)}
                  </label>
                </TableCell>
              </TableRow>
            ))}
            {linhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sand-400">
                  Nenhum funcionário cadastrado ainda — cadastre na aba Férias.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
