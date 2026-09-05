import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarLembreteDocumentos, competenciaMesAnterior, EmailNaoConfiguradoError } from "@/lib/lembrete-documentos";

/** Roda todo dia (via cron do Vercel) mas só dispara no dia configurado em
 * LEMBRETE_DOCUMENTOS_DIA — varre todo cliente com checklist mensal
 * configurado e manda o lembrete de "mês anterior" pra quem tem documento
 * pendente. Dedup por competência mora em enviarLembreteDocumentos. */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const diaEnvio = Number(process.env.LEMBRETE_DOCUMENTOS_DIA) || 5;
  if (new Date().getDate() !== diaEnvio) {
    return NextResponse.json({ ok: true, ignorado: `Só roda no dia ${diaEnvio} do mês.` });
  }

  const competencia = competenciaMesAnterior();
  const admin = createAdminClient();
  const { data: tiposRows } = await admin.from("tipos_documento_recorrente").select("cliente_id").eq("ativo", true);
  const clienteIds = Array.from(new Set((tiposRows ?? []).map((r) => r.cliente_id as string)));

  const enviados: string[] = [];
  const ignorados: string[] = [];
  const erros: string[] = [];

  for (const clienteId of clienteIds) {
    try {
      const resultado = await enviarLembreteDocumentos(clienteId, competencia);
      if (resultado.enviado) enviados.push(resultado.clienteNome ?? clienteId);
      else ignorados.push(`${resultado.clienteNome ?? clienteId}: ${resultado.motivo}`);
    } catch (err) {
      if (err instanceof EmailNaoConfiguradoError) {
        return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
      }
      erros.push(`${clienteId}: ${err instanceof Error ? err.message : "erro desconhecido"}`);
    }
  }

  return NextResponse.json({ ok: true, competencia, enviados, ignorados, erros });
}
