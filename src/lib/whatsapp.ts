import { createAdminClient } from "@/lib/supabase/admin";
import { telefonePrincipalCliente } from "@/lib/contato-telefone";
import { vencimentoDaCompetencia } from "@/lib/boleto";
import type { Client, BoletoMensal } from "@/lib/types";

const GRAPH_API = "https://graph.facebook.com/v21.0";

export class WhatsappNaoConfiguradoError extends Error {
  constructor() {
    super(
      "O envio de WhatsApp ainda não foi configurado (faltam as variáveis WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID)."
    );
  }
}

/** Normaliza um telefone cadastrado (com ou sem DDI/traços/espaços/parênteses)
 * pro formato que a API do WhatsApp espera (DDI + DDD + número, só dígitos).
 * Retorna null se não sobrar dígito suficiente pra ser um número válido. */
export function normalizarTelefoneWhatsapp(telefone: string): string | null {
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  if (digitos.startsWith("55") && digitos.length >= 12) return digitos;
  return `55${digitos}`;
}

async function buscarCliente(admin: ReturnType<typeof createAdminClient>, clienteId: string): Promise<Client | null> {
  const { data } = await admin.from("dados_financeiros").select("data").eq("tipo", "clients").eq("id", clienteId).maybeSingle();
  return (data?.data as Client | undefined) ?? null;
}

async function buscarBoleto(
  admin: ReturnType<typeof createAdminClient>,
  clienteId: string,
  competencia: string
): Promise<BoletoMensal | null> {
  const { data } = await admin
    .from("dados_financeiros")
    .select("data")
    .eq("tipo", "boletosMensais")
    .eq("id", `bol-${clienteId}-${competencia}`)
    .maybeSingle();
  return (data?.data as BoletoMensal | undefined) ?? null;
}

async function jaEnviouLembrete(admin: ReturnType<typeof createAdminClient>, clienteId: string, competencia: string): Promise<boolean> {
  const { data } = await admin
    .from("dados_financeiros")
    .select("id")
    .eq("tipo", "lembretesWhatsapp")
    .eq("id", `${clienteId}-${competencia}`)
    .maybeSingle();
  return !!data;
}

async function registrarLembreteEnviado(
  admin: ReturnType<typeof createAdminClient>,
  clienteId: string,
  competencia: string,
  telefone: string
) {
  await admin.from("dados_financeiros").upsert(
    {
      tipo: "lembretesWhatsapp",
      id: `${clienteId}-${competencia}`,
      cliente_id: clienteId,
      data: { clienteId, competencia, telefone, enviadoEm: new Date().toISOString() },
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "tipo,id" }
  );
}

async function enviarTemplateWhatsapp(telefone: string, parametrosBody: string[]) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) throw new WhatsappNaoConfiguradoError();
  const template = process.env.WHATSAPP_TEMPLATE_NAME || "lembrete_vencimento_boleto";

  const res = await fetch(`${GRAPH_API}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: telefone,
      type: "template",
      template: {
        name: template,
        language: { code: "pt_BR" },
        components: [{ type: "body", parameters: parametrosBody.map((texto) => ({ type: "text", text: texto })) }],
      },
    }),
  });
  if (!res.ok) {
    const corpo = await res.text();
    throw new Error(`Falha ao enviar WhatsApp (${res.status}): ${corpo}`);
  }
}

export interface ResultadoLembreteBoleto {
  enviado: boolean;
  motivo?: string;
  clienteNome?: string;
}

/** Envia o lembrete de vencimento de boleto de um cliente numa competência —
 * confere telefone cadastrado e (a menos que `forcar`) evita reenviar o mesmo
 * lembrete pra mesma competência mais de uma vez. Usado tanto pelo cron diário
 * quanto pelo botão manual "Enviar lembrete" da tela de Boletos. */
export async function enviarLembreteBoleto(clienteId: string, competencia: string, forcar = false): Promise<ResultadoLembreteBoleto> {
  const admin = createAdminClient();
  const client = await buscarCliente(admin, clienteId);
  if (!client) return { enviado: false, motivo: "Cliente não encontrado." };

  const clienteNome = client.dados.nomeFantasia ?? client.dados.razaoSocial;
  const telefone = telefonePrincipalCliente(client);
  if (!telefone) return { enviado: false, motivo: "Cliente sem telefone cadastrado.", clienteNome };
  const telefoneNormalizado = normalizarTelefoneWhatsapp(telefone);
  if (!telefoneNormalizado) return { enviado: false, motivo: "Telefone cadastrado inválido.", clienteNome };

  if (!forcar && (await jaEnviouLembrete(admin, clienteId, competencia))) {
    return { enviado: false, motivo: "Lembrete já enviado para essa competência.", clienteNome };
  }

  const boleto = await buscarBoleto(admin, clienteId, competencia);
  if (boleto?.removido) return { enviado: false, motivo: "Boleto removido nessa competência.", clienteNome };
  if (boleto?.recebido) return { enviado: false, motivo: "Boleto já recebido nessa competência.", clienteNome };

  const valor = boleto?.valor ?? client.financeiro.valorMensal;
  const vencimento = boleto?.vencimento ?? vencimentoDaCompetencia(competencia, client.financeiro.vencimentoDia);
  const vencimentoFormatado = vencimento.split("-").reverse().join("/");
  const valorFormatado = valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  await enviarTemplateWhatsapp(telefoneNormalizado, [clienteNome, valorFormatado, vencimentoFormatado]);
  await registrarLembreteEnviado(admin, clienteId, competencia, telefoneNormalizado);

  return { enviado: true, clienteNome };
}
