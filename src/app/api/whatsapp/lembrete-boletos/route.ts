import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarLembreteBoleto, WhatsappNaoConfiguradoError } from "@/lib/whatsapp";
import { vencimentoDaCompetencia } from "@/lib/boleto";
import type { Client, BoletoMensal } from "@/lib/types";

/** Roda todo dia (via cron do Vercel) — varre todos os clientes mensais e
 * dispara o lembrete de WhatsApp pra quem tem boleto vencendo dentro da
 * janela configurada em WHATSAPP_LEMBRETE_DIAS_ANTES. O dedup por competência
 * mora dentro de enviarLembreteBoleto, então rodar mais de uma vez no mesmo
 * dia (ou reprocessar o mês inteiro) não reenvia pra quem já recebeu. */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const diasAntes = Number(process.env.WHATSAPP_LEMBRETE_DIAS_ANTES) || 3;
  const admin = createAdminClient();

  const [{ data: clientesRows }, { data: boletosRows }] = await Promise.all([
    admin.from("dados_financeiros").select("id, data").eq("tipo", "clients"),
    admin.from("dados_financeiros").select("id, data").eq("tipo", "boletosMensais"),
  ]);

  const boletoPorId = new Map<string, BoletoMensal>();
  for (const row of boletosRows ?? []) boletoPorId.set(row.id, row.data as BoletoMensal);

  const hoje = new Date();
  const limite = new Date(hoje);
  limite.setDate(limite.getDate() + diasAntes);
  const hojeStr = hoje.toISOString().slice(0, 10);
  const limiteStr = limite.toISOString().slice(0, 10);

  const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
  const competenciasParaChecar = [
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`,
    `${proximoMes.getFullYear()}-${String(proximoMes.getMonth() + 1).padStart(2, "0")}`,
  ];

  const enviados: string[] = [];
  const ignorados: string[] = [];
  const erros: string[] = [];

  for (const row of clientesRows ?? []) {
    const client = row.data as Client;
    if (!client?.financeiro || client.financeiro.valorMensal <= 0 || client.dados.clienteParceiro) continue;
    const inicio = client.financeiro.inicioContrato?.slice(0, 7);

    for (const competencia of competenciasParaChecar) {
      if (inicio && competencia < inicio) continue;
      const boleto = boletoPorId.get(`bol-${client.id}-${competencia}`);
      if (boleto?.removido || boleto?.recebido) continue;

      const vencimento = boleto?.vencimento ?? vencimentoDaCompetencia(competencia, client.financeiro.vencimentoDia);
      if (vencimento < hojeStr || vencimento > limiteStr) continue;

      try {
        const resultado = await enviarLembreteBoleto(client.id, competencia);
        if (resultado.enviado) enviados.push(`${resultado.clienteNome} (${competencia})`);
        else ignorados.push(`${resultado.clienteNome ?? client.id} (${competencia}): ${resultado.motivo}`);
      } catch (err) {
        if (err instanceof WhatsappNaoConfiguradoError) {
          return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
        }
        erros.push(`${client.id} (${competencia}): ${err instanceof Error ? err.message : "erro desconhecido"}`);
      }
    }
  }

  return NextResponse.json({ ok: true, enviados, ignorados, erros });
}
