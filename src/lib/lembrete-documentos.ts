import { createAdminClient } from "@/lib/supabase/admin";
import { emailPrincipalCliente } from "@/lib/contato-email";
import { enviarEmail, appUrl, logoUrl, EmailNaoConfiguradoError } from "@/lib/email";
import type { Client, TipoDocumentoRecorrente, EnvioMensalDocumento, StatusEnvioMensal } from "@/lib/types";

export { EmailNaoConfiguradoError };

const MESES_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** Competência do mês anterior ao de hoje — é o período que normalmente já
 * fechou e cujos documentos o escritório está pronto pra receber. */
export function competenciaMesAnterior(): string {
  const hoje = new Date();
  const anterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  return `${anterior.getFullYear()}-${String(anterior.getMonth() + 1).padStart(2, "0")}`;
}

function labelCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-");
  return `${MESES_PT[Number(mes) - 1] ?? mes}/${ano}`;
}

async function buscarCliente(admin: ReturnType<typeof createAdminClient>, clienteId: string): Promise<Client | null> {
  const { data } = await admin.from("dados_financeiros").select("data").eq("tipo", "clients").eq("id", clienteId).maybeSingle();
  return (data?.data as Client | undefined) ?? null;
}

async function buscarTiposAtivos(admin: ReturnType<typeof createAdminClient>, clienteId: string): Promise<TipoDocumentoRecorrente[]> {
  const { data } = await admin
    .from("tipos_documento_recorrente")
    .select("id, cliente_id, nome, ativo, criado_em")
    .eq("cliente_id", clienteId)
    .eq("ativo", true);
  return (data ?? []).map((r) => ({ id: r.id, clienteId: r.cliente_id, nome: r.nome, ativo: r.ativo, criadoEm: r.criado_em }));
}

async function buscarEnviosDaCompetencia(
  admin: ReturnType<typeof createAdminClient>,
  clienteId: string,
  competencia: string
): Promise<EnvioMensalDocumento[]> {
  const { data } = await admin
    .from("envios_mensais_documento")
    .select("id, cliente_id, tipo_id, competencia, status, documento_id")
    .eq("cliente_id", clienteId)
    .eq("competencia", competencia);
  return (data ?? []).map((r) => ({
    id: r.id,
    clienteId: r.cliente_id,
    tipoId: r.tipo_id,
    competencia: r.competencia,
    status: r.status as StatusEnvioMensal,
    documentoId: r.documento_id ?? undefined,
  }));
}

async function jaEnviouLembrete(admin: ReturnType<typeof createAdminClient>, clienteId: string, competencia: string): Promise<boolean> {
  const { data } = await admin
    .from("dados_financeiros")
    .select("id")
    .eq("tipo", "lembretesDocumentos")
    .eq("id", `${clienteId}-${competencia}`)
    .maybeSingle();
  return !!data;
}

async function registrarLembreteEnviado(
  admin: ReturnType<typeof createAdminClient>,
  clienteId: string,
  competencia: string,
  email: string
) {
  await admin.from("dados_financeiros").upsert(
    {
      tipo: "lembretesDocumentos",
      id: `${clienteId}-${competencia}`,
      cliente_id: clienteId,
      data: { clienteId, competencia, email, enviadoEm: new Date().toISOString() },
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "tipo,id" }
  );
}

function montarEmail(clienteNome: string, nomesDocumentos: string[], competencia: string, marcaTeste = false): { subject: string; html: string; text: string } {
  const url = appUrl();
  const portalUrl = `${url}/portal`;
  const compLabel = labelCompetencia(competencia);
  const itens = nomesDocumentos.map((n) => `<li style="margin-bottom:4px;">${n}</li>`).join("");

  const subject = `${marcaTeste ? "[TESTE] " : ""}Documentos de ${compLabel} da empresa ${clienteNome} para a contabilidade`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <img src="${logoUrl()}" alt="Eleven Contabilidade & Consultoria" width="140" style="display:block; margin: 0 auto 24px; height:auto;" />
      <h2 style="color:#5C1420;">Envio de documentos</h2>
      <p>Olá!</p>
      <p>Favor enviar os documentos referentes ao período de <strong>${compLabel}</strong>, da empresa <strong>${clienteNome}</strong>.</p>
      <p><strong>Documentos necessários:</strong></p>
      <ul style="padding-left: 18px;">${itens}</ul>
      <p><a href="${portalUrl}" style="background:#5C1420; color:#fff; padding: 10px 18px; border-radius: 8px; text-decoration:none; display:inline-block;">Enviar documentos</a></p>
      <p style="color:#8A8A8A; font-size: 12px;">Atenciosamente,<br />Eleven Contabilidade &amp; Consultoria</p>
    </div>
  `;
  const text = [
    "Envio de documentos",
    "",
    `Favor enviar os documentos referentes ao período de ${compLabel}, da empresa ${clienteNome}.`,
    "",
    "Documentos necessários:",
    ...nomesDocumentos.map((n) => `- ${n}`),
    "",
    `Enviar documentos: ${portalUrl}`,
  ].join("\n");

  return { subject, html, text };
}

export interface ResultadoLembreteDocumentos {
  enviado: boolean;
  motivo?: string;
  clienteNome?: string;
}

/** Envia o lembrete mensal de documentos pendentes de um cliente — confere
 * e-mail cadastrado e (a menos que `forcar`) evita reenviar o mesmo lembrete
 * pra mesma competência mais de uma vez. */
export async function enviarLembreteDocumentos(
  clienteId: string,
  competencia: string,
  forcar = false
): Promise<ResultadoLembreteDocumentos> {
  const admin = createAdminClient();
  const client = await buscarCliente(admin, clienteId);
  if (!client) return { enviado: false, motivo: "Cliente não encontrado." };

  const clienteNome = client.dados.nomeFantasia ?? client.dados.razaoSocial;
  const email = emailPrincipalCliente(client);
  if (!email) return { enviado: false, motivo: "Cliente sem e-mail de contato cadastrado.", clienteNome };

  const tipos = await buscarTiposAtivos(admin, clienteId);
  if (tipos.length === 0) return { enviado: false, motivo: "Nenhum tipo de documento configurado pra esse cliente.", clienteNome };

  const envios = await buscarEnviosDaCompetencia(admin, clienteId, competencia);
  const statusPorTipo = new Map(envios.map((e) => [e.tipoId, e.status]));
  const pendentes = tipos.filter((t) => {
    const status = statusPorTipo.get(t.id) ?? "Pendente";
    return status === "Pendente" || status === "Em andamento";
  });
  if (pendentes.length === 0) return { enviado: false, motivo: "Nenhum documento pendente nessa competência.", clienteNome };

  if (!forcar && (await jaEnviouLembrete(admin, clienteId, competencia))) {
    return { enviado: false, motivo: "Lembrete já enviado para essa competência.", clienteNome };
  }

  const { subject, html, text } = montarEmail(clienteNome, pendentes.map((t) => t.nome), competencia);
  await enviarEmail({ to: email, subject, html, text });
  await registrarLembreteEnviado(admin, clienteId, competencia, email);

  return { enviado: true, clienteNome };
}

/** Envia um e-mail de teste com o mesmo template, pra um endereço qualquer —
 * lista todos os tipos ativos (não só os pendentes), já que é só uma prévia. */
export async function enviarEmailTesteDocumentos(clienteId: string, competencia: string, paraEmail: string): Promise<{ clienteNome?: string }> {
  const admin = createAdminClient();
  const client = await buscarCliente(admin, clienteId);
  if (!client) throw new Error("Cliente não encontrado.");

  const clienteNome = client.dados.nomeFantasia ?? client.dados.razaoSocial;
  const tipos = await buscarTiposAtivos(admin, clienteId);
  if (tipos.length === 0) throw new Error("Nenhum tipo de documento configurado pra esse cliente.");

  const { subject, html, text } = montarEmail(clienteNome, tipos.map((t) => t.nome), competencia, true);
  await enviarEmail({ to: paraEmail, subject, html, text });

  return { clienteNome };
}
