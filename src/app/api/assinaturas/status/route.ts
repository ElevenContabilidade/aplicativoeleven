import { NextResponse } from "next/server";

/** Consulta o status atual de um documento enviado pra assinatura na
 * Autentique (quem já assinou/recusou). Chamada sob demanda pelo botão
 * "Atualizar status" — sem webhook configurado, esse é o jeito de saber se
 * mudou algo desde o envio. */
const AUTENTIQUE_ENDPOINT = "https://api.autentique.com.br/v2/graphql";

const DOCUMENT_STATUS_QUERY = `
  query GetDocumentStatus($id: UUID!) {
    document(id: $id) {
      id
      name
      files {
        signed
      }
      signatures {
        public_id
        name
        email
        link { short_link }
        signed { created_at }
        rejected { created_at }
      }
    }
  }
`;

export async function POST(request: Request) {
  const apiToken = process.env.AUTENTIQUE_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json({ ok: false, configured: false });
  }

  let body: { documentId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, configured: true, error: "Requisição inválida." }, { status: 400 });
  }

  if (!body.documentId) {
    return NextResponse.json({ ok: false, configured: true, error: "documentId é obrigatório." }, { status: 400 });
  }

  try {
    const res = await fetch(AUTENTIQUE_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: DOCUMENT_STATUS_QUERY, variables: { id: body.documentId } }),
    });
    interface AutentiqueSignature {
      public_id: string;
      name: string;
      email: string;
      link?: { short_link?: string };
      signed?: { created_at?: string } | null;
      rejected?: { created_at?: string } | null;
    }
    const texto = await res.text();
    let json: {
      data?: { document?: { id: string; files?: { signed?: string | null }; signatures?: AutentiqueSignature[] } };
      errors?: { message: string }[];
    };
    try {
      json = JSON.parse(texto);
    } catch {
      return NextResponse.json(
        { ok: false, configured: true, error: `Resposta inesperada da Autentique (HTTP ${res.status}): ${texto.slice(0, 300)}` },
        { status: 502 }
      );
    }

    if (json.errors?.length) {
      const mensagem = json.errors.map((e: { message: string }) => e.message).join("; ");
      return NextResponse.json({ ok: false, configured: true, error: mensagem }, { status: 502 });
    }

    const doc = json.data?.document;
    if (!doc?.id) {
      return NextResponse.json(
        { ok: false, configured: true, error: "Documento não encontrado na Autentique.", raw: json },
        { status: 404 }
      );
    }

    const signatures = (doc.signatures ?? []).map((sig) => ({
      publicId: sig.public_id,
      nome: sig.name,
      email: sig.email,
      link: sig.link?.short_link,
      assinado: !!sig.signed,
      dataAssinatura: sig.signed?.created_at,
      recusado: !!sig.rejected,
    }));

    return NextResponse.json({ ok: true, configured: true, signatures, pdfAssinadoUrl: doc.files?.signed ?? undefined });
  } catch (err) {
    return NextResponse.json(
      { ok: false, configured: true, error: err instanceof Error ? err.message : "Erro desconhecido." },
      { status: 502 }
    );
  }
}
