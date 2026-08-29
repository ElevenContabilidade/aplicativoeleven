"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";
import { formatDate } from "@/lib/utils";
import type { Client, DepartamentoChave } from "@/lib/types";

const LABELS: Record<DepartamentoChave, string> = {
  fiscal: "Setor Fiscal",
  contabil: "Setor Contábil",
  pessoal: "Setor Pessoal",
};

export function DepartmentNotesCard({ client, depto }: { client: Client; depto: DepartamentoChave }) {
  const updateNotaDepartamento = useAppStore((s) => s.updateNotaDepartamento);
  const saved = client.notasDepartamentos?.[depto];
  const [draft, setDraft] = useState(saved?.nota ?? "");
  const dirty = draft !== (saved?.nota ?? "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{LABELS[depto]}</CardTitle>
        {saved?.atualizadoEm && (
          <span className="text-[11px] text-sand-400">Atualizado em {formatDate(saved.atualizadoEm)}</span>
        )}
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        <Textarea
          placeholder={`Situação atual do ${LABELS[depto].toLowerCase()}…`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-h-16 text-xs"
        />
        <Button
          size="sm"
          variant="outline"
          disabled={!dirty}
          onClick={() => updateNotaDepartamento(client.id, depto, draft)}
        >
          Salvar nota
        </Button>
      </CardContent>
    </Card>
  );
}
