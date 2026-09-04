import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { LICENCA_STATUS } from "@/lib/types";

const LicencaExtraidaSchema = z.object({
  nome: z.string().nullable().describe("Nome/tipo do documento, ex: Alvará de Funcionamento, Certidão Negativa de Débitos"),
  dataEmissao: z.string().nullable().describe("Data de emissão do documento, no formato AAAA-MM-DD. null se não encontrar."),
  dataVencimento: z.string().nullable().describe("Data de vencimento/validade do documento, no formato AAAA-MM-DD. null se não encontrar."),
  status: z.enum(LICENCA_STATUS).nullable().describe("Status atual do documento, com base na data de vencimento em relação a hoje."),
  observacoes: z.string().nullable().describe("Outras informações relevantes: número do processo/protocolo, órgão emissor, restrições, condicionantes etc."),
});

export async function POST(request: Request) {
  let body: { pdfBase64?: string; instrucoes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }
  if (!body.pdfBase64) {
    return NextResponse.json({ ok: false, error: "Nenhum arquivo enviado." }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "A IA ainda não foi configurada — falta a chave ANTHROPIC_API_KEY nas variáveis de ambiente." },
      { status: 409 }
    );
  }

  const instrucoes = body.instrucoes?.trim() || "Identifique o nome do documento, a data de emissão, a data de vencimento e observações relevantes (número do processo, órgão emissor, restrições).";

  try {
    const client = new Anthropic();
    const hoje = new Date().toISOString().slice(0, 10);

    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: body.pdfBase64 } },
            {
              type: "text",
              text:
                `Este é um documento (licença, certidão, alvará ou registro) de um escritório de contabilidade. ` +
                `Hoje é ${hoje}. Extraia os campos pedidos pelo schema.\n\n` +
                `Instruções de como identificar cada informação:\n${instrucoes}\n\n` +
                `Status possíveis: ${LICENCA_STATUS.join(", ")} — "Vencendo" se a data de vencimento estiver próxima (dentro de 30 dias) ou já passou há pouco, "Vencida" se já passou há mais tempo, "Regular" se está tudo em dia, "Em renovação" só se o próprio documento indicar isso.`,
            },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(LicencaExtraidaSchema) },
    });

    if (!response.parsed_output) {
      return NextResponse.json({ ok: false, error: "Não consegui identificar os dados desse documento." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, dados: response.parsed_output });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Não foi possível processar o documento com a IA." },
      { status: 502 }
    );
  }
}
