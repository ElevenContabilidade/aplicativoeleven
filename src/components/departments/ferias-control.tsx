"use client";

import { useMemo, useState } from "react";
import { Plus, Check, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { FuncionarioFormDialog } from "@/components/departments/funcionario-form-dialog";
import { periodoAtivo, statusFerias, type StatusFerias } from "@/lib/ferias";
import { formatDate } from "@/lib/utils";

const STATUS_STYLE: Record<StatusFerias, string> = {
  Ok: "bg-status-success-bg text-status-success",
  "Próximo do vencimento": "bg-status-warning-bg text-status-warning",
  Vencido: "bg-status-danger-bg text-status-danger",
};

export function FeriasControl() {
  const clients = useAppStore((s) => s.clients);
  const funcionarios = useAppStore((s) => s.funcionarios);
  const updateFuncionario = useAppStore((s) => s.updateFuncionario);
  const confirmarPeriodoFerias = useAppStore((s) => s.confirmarPeriodoFerias);

  const [formOpen, setFormOpen] = useState(false);

  const linhas = useMemo(() => {
    return funcionarios
      .filter((f) => f.ativo)
      .map((f) => {
        const cliente = clients.find((c) => c.id === f.clienteId);
        if (!cliente?.dados.possuiFuncionarios) return null;
        const periodo = periodoAtivo(f);
        const status = statusFerias(periodo.prazoLimite);
        return { funcionario: f, cliente, periodo, status };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null)
      .sort((a, b) => a.periodo.prazoLimite.localeCompare(b.periodo.prazoLimite));
  }, [funcionarios, clients]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarClock className="size-4 text-wine-600" /> Controle de férias</CardTitle>
        <Button size="sm" onClick={() => setFormOpen(true)}><Plus className="size-3.5" /> Novo funcionário</Button>
      </CardHeader>
      <CardContent className="overflow-x-auto pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Funcionário</TableHead>
              <TableHead>Admissão</TableHead>
              <TableHead>Período aquisitivo</TableHead>
              <TableHead>Prazo limite p/ gozo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Férias programadas</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map(({ funcionario: f, cliente, periodo, status }) => (
              <TableRow key={f.id}>
                <TableCell className="text-sand-500">{cliente!.dados.nomeFantasia || cliente!.dados.razaoSocial}</TableCell>
                <TableCell className="font-medium text-sand-800">{f.nome}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(f.dataAdmissao)}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  {formatDate(periodo.periodoInicio)} – {formatDate(periodo.periodoFim)}
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium">{formatDate(periodo.prazoLimite)}</TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLE[status]}`}>{status}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="date"
                      value={f.feriasProgramadasInicio ?? ""}
                      onChange={(e) => updateFuncionario(f.id, { feriasProgramadasInicio: e.target.value || undefined })}
                      className="h-7 w-32 text-xs"
                    />
                    <Input
                      type="date"
                      value={f.feriasProgramadasFim ?? ""}
                      onChange={(e) => updateFuncionario(f.id, { feriasProgramadasFim: e.target.value || undefined })}
                      className="h-7 w-32 text-xs"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  {f.feriasProgramadasInicio && f.feriasProgramadasFim && (
                    <button
                      type="button"
                      title="Confirmar período — avança pro próximo ano aquisitivo"
                      onClick={() => confirmarPeriodoFerias(f.id)}
                      className="flex size-7 items-center justify-center rounded-md text-status-success hover:bg-status-success-bg"
                    >
                      <Check className="size-4" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {linhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sand-400">
                  Nenhum funcionário cadastrado. Marque &quot;Possui funcionários&quot; no cadastro do cliente e cadastre aqui.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <FuncionarioFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </Card>
  );
}
