import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Marca o status do envio de um tipo de documento recorrente num mês
 * (competência). Passa pelo backend (não RLS direto) porque quem chama é o
 * Portal do Cliente, que ainda não tem sessão Supabase Auth. */
export async function POST(request: Request) {
  let body: { clienteId?: string; tipoId?: string; competencia?: string; status?: string; documentoId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }
  const { clienteId, tipoId, competencia, status, documentoId } = body;
  if (!clienteId || !tipoId || !competencia || !status) {
    return NextResponse.json({ ok: false, error: "clienteId, tipoId, competencia e status são obrigatórios." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("envios_mensais_documento").upsert(
    {
      id: `${tipoId}-${competencia}`,
      cliente_id: clienteId,
      tipo_id: tipoId,
      competencia,
      status,
      documento_id: documentoId || null,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 502 });

  return NextResponse.json({ ok: true });
}
