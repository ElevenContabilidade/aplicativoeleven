import { NextResponse } from "next/server";

/** Envia um PDF pra assinatura eletrônica via API da Autentique (GraphQL,
 * upload multipart). Depende de AUTENTIQUE_API_TOKEN estar configurada no
 * ambiente (Vercel → Project Settings → Environment Variables); sem ela,
 * retorna configured:false. */
const AUTENTIQUE_ENDPOINT = "https://api.autentique.com.br/v2/graphql";

const CREATE_DOCUMENT_MUTATION = `
  mutation CreateDocumentMutation($sandbox: Boolean, $document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
    createDocument(sandbox: $sandbox, document: $document, signers: $signers, file: $file) {
      id
      name
      created_at
      signatures {
        public_id
        name
        email
        created_at
        action { name }
        link { short_link }
      }
    }
  }
`;

interface SignatarioInput {
  nome: string;
  email: string;
}

export async function POST(request: Request) {
  const apiToken = process.env.AUTENTIQUE_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json({ sent: false, configured: false });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ sent: false, configured: true, error: "Requisição inválida." }, { status: 400 });
  }

  const nomeDocumento = form.get("nomeDocumento");
  const signatariosRaw = form.get("signatarios");
  const sandbox = form.get("sandbox") === "true";
  const arquivo = form.get("arquivo");

  if (typeof nomeDocumento !== "string" || typeof signatariosRaw !== "string" || !(arquivo instanceof Blob)) {
    return NextResponse.json(
      { sent: false, configured: true, error: "Documento, nome e signatários são obrigatórios." },
      { status: 400 }
    );
  }

  let signatarios: SignatarioInput[];
  try {
    signatarios = JSON.parse(signatariosRaw);
  } catch {
    return NextResponse.json({ sent: false, configured: true, error: "Lista de signatários inválida." }, { status: 400 });
  }
  if (!Array.isArray(signatarios) || signatarios.length === 0) {
    return NextResponse.json({ sent: false, configured: true, error: "Informe ao menos um signatário." }, { status: 400 });
  }

  const operations = {
    query: CREATE_DOCUMENT_MUTATION,
    variables: {
      sandbox,
      document: { name: nomeDocumento },
      signers: signatarios.map((s) => ({ email: s.email, action: "SIGN" })),
      file: null,
    },
  };

  const autentiqueForm = new FormData();
  autentiqueForm.append("operations", JSON.stringify(operations));
  autentiqueForm.append("map", JSON.stringify({ "0": ["variables.file"] }));
  const fileName = arquivo instanceof File && arquivo.name ? arquivo.name : "contrato.pdf";
  autentiqueForm.append("0", arquivo, fileName);

  try {
    const res = await fetch(AUTENTIQUE_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiToken}` },
      body: autentiqueForm,
    });
    interface AutentiqueSignature {
      public_id: string;
      name: string;
      email: string;
      link?: { short_link?: string };
    }
    const texto = await res.text();
    let json: {
      data?: { createDocument?: { id: string; signatures?: AutentiqueSignature[] } };
      errors?: { message: string }[];
    };
    try {
      json = JSON.parse(texto);
    } catch {
      return NextResponse.json(
        { sent: false, configured: true, error: `Resposta inesperada da Autentique (HTTP ${res.status}): ${texto.slice(0, 300)}` },
        { status: 502 }
      );
    }

    if (json.errors?.length) {
      const mensagem = json.errors.map((e: { message: string }) => e.message).join("; ");
      return NextResponse.json({ sent: false, configured: true, error: mensagem }, { status: 502 });
    }

    const doc = json.data?.createDocument;
    if (!doc?.id) {
      return NextResponse.json(
        { sent: false, configured: true, error: "Resposta inesperada da Autentique.", raw: json },
        { status: 502 }
      );
    }

    return NextResponse.json({
      sent: true,
      configured: true,
      documentId: doc.id as string,
      signatures: (doc.signatures ?? []).map((sig) => ({
        publicId: sig.public_id,
        nome: sig.name,
        email: sig.email,
        link: sig.link?.short_link,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { sent: false, configured: true, error: err instanceof Error ? err.message : "Erro desconhecido." },
      { status: 502 }
    );
  }
}
