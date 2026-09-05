import { NextResponse } from "next/server";
import { enviarLembreteDocumentos, competenciaMesAnterior, EmailNaoConfiguradoError } from "@/lib/lembrete-documentos";

export async function POST(request: Request) {
  let body: { clienteId?: string; competencia?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }
  if (!body.clienteId) {
    return NextResponse.json({ ok: false, error: "clienteId é obrigatório." }, { status: 400 });
  }

  try {
    const resultado = await enviarLembreteDocumentos(body.clienteId, body.competencia || competenciaMesAnterior(), true);
    return NextResponse.json({ ok: true, ...resultado });
  } catch (err) {
    if (err instanceof EmailNaoConfiguradoError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Erro ao enviar lembrete." }, { status: 502 });
  }
}
