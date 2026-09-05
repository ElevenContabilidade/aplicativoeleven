import { NextResponse } from "next/server";
import { enviarLembreteBoleto, WhatsappNaoConfiguradoError } from "@/lib/whatsapp";

export async function POST(request: Request) {
  let body: { clienteId?: string; competencia?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }
  if (!body.clienteId || !body.competencia) {
    return NextResponse.json({ ok: false, error: "clienteId e competencia são obrigatórios." }, { status: 400 });
  }

  try {
    const resultado = await enviarLembreteBoleto(body.clienteId, body.competencia, true);
    return NextResponse.json({ ok: true, ...resultado });
  } catch (err) {
    if (err instanceof WhatsappNaoConfiguradoError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Erro ao enviar lembrete." }, { status: 502 });
  }
}
