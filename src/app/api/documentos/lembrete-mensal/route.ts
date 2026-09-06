import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarLembreteDocumentos, competenciaMesAnterior, EmailNaoConfiguradoError } from "@/lib/lembrete-documentos";

/** Roda todo dia (via cron do Vercel) mas só dispara nos dias configurados em
 * LEMBRETE_DOCUMENTOS_DIAS (ex: "1,3,5") — varre todo cliente com checklist
 * mensal configurado e manda o lembrete de "mês anterior" pra quem AINDA
 * tem documento pendente. Como o dedup em enviarLembreteDocumentos é por
 * dia (não por competência inteira), quem não enviou continua recebendo o
 * lembrete em cada um dos dias configurados — só para de cobrar quando os
 * documentos daquela competência são todos enviados. */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const diasEnvio = (process.env.LEMBRETE_DOCUMENTOS_DIAS || "1,3,5")
    .split(",")
    .map((d) => Number(d.trim()))
    .filter((d) => Number.isInteger(d) && d >= 1 && d <= 31);
  if (!diasEnvio.includes(new Date().getDate())) {
    return NextResponse.json({ ok: true, ignorado: `Só roda nos dias ${diasEnvio.join(", ")} do mês.` });
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
