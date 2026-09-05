import { NextResponse } from "next/server";
import { enviarEmailTesteDocumentos, competenciaMesAnterior, EmailNaoConfiguradoError } from "@/lib/lembrete-documentos";

export async function POST(request: Request) {
  let body: { clienteId?: string; competencia?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }
  if (!body.clienteId || !body.email) {
    return NextResponse.json({ ok: false, error: "clienteId e email são obrigatórios." }, { status: 400 });
  }

  try {
    const resultado = await enviarEmailTesteDocumentos(body.clienteId, body.competencia || competenciaMesAnterior(), body.email);
    return NextResponse.json({ ok: true, ...resultado });
  } catch (err) {
    if (err instanceof EmailNaoConfiguradoError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Erro ao enviar e-mail de teste." }, { status: 502 });
  }
}
