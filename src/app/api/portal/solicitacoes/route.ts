import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Client, Task } from "@/lib/types";

/** Fala com a Eleven direto pelo Portal do Cliente — vira uma Tarefa no
 * departamento Atendimento, já direcionada pro responsável de relacionamento
 * daquele cliente, do jeito que qualquer outra tarefa criada pela equipe fica. */
export async function POST(request: Request) {
  let body: { clienteId?: string; titulo?: string; descricao?: string; prazo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }
  const titulo = body.titulo?.trim();
  if (!body.clienteId || !titulo) {
    return NextResponse.json({ ok: false, error: "clienteId e titulo são obrigatórios." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: clienteRow } = await admin
    .from("dados_financeiros")
    .select("data")
    .eq("tipo", "clients")
    .eq("id", body.clienteId)
    .maybeSingle();
  const client = clienteRow?.data as Client | undefined;
  if (!client) return NextResponse.json({ ok: false, error: "Cliente não encontrado." }, { status: 404 });

  const task: Task = {
    id: `task-portal-${Date.now()}`,
    titulo,
    descricao: body.descricao?.trim() || undefined,
    clienteId: body.clienteId,
    departamento: "Atendimento",
    responsavelId: client.responsaveis.relacionamento ?? "",
    prioridade: "Normal",
    prazo: body.prazo || new Date().toISOString().slice(0, 10),
    status: "Não iniciada",
    subtarefas: [],
    comentarios: [],
  };

  const { error } = await admin
    .from("dados_financeiros")
    .upsert({ tipo: "tasks", id: task.id, cliente_id: task.clienteId, data: task }, { onConflict: "tipo,id" });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 502 });

  return NextResponse.json({ ok: true });
}
