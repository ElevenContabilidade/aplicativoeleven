import { AlertTriangle, Check, Clock, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Pendencia } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function estaAtrasada(p: Pendencia): boolean {
  if (p.status === "Concluída" || !p.prazo) return false;
  return new Date(p.prazo) < new Date(new Date().toISOString().slice(0, 10));
}

export function PendenciasCard({ pendencias }: { pendencias: Pendencia[] }) {
  const abertas = pendencias
    .filter((p) => p.status !== "Concluída")
    .sort((a, b) => (estaAtrasada(b) ? 1 : 0) - (estaAtrasada(a) ? 1 : 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="size-4 text-wine-600" /> O que a Eleven está aguardando de você
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        {abertas.map((p) => {
          const atrasada = estaAtrasada(p);
          return (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-sand-200 px-3 py-2.5 text-xs"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-sand-800">{p.titulo}</p>
                <p className="text-sand-400">{p.tipo}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {p.prazo && (
                  <span className="flex items-center gap-1 text-sand-400">
                    <Clock className="size-3" /> {formatDate(p.prazo)}
                  </span>
                )}
                <Badge variant={atrasada ? "danger" : "warning"}>
                  {atrasada ? <AlertTriangle className="size-3" /> : null}
                  {atrasada ? "Atrasado" : "Pendente"}
                </Badge>
              </div>
            </div>
          );
        })}
        {abertas.length === 0 && (
          <p className="flex items-center gap-1.5 text-xs text-status-success">
            <Check className="size-3.5" /> Tudo em dia — nenhuma pendência no momento.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
