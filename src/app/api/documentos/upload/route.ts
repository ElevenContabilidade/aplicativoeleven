import { NextResponse } from "next/server";
import { ensureCategoriaFolder, ensureClienteFolder, getClienteLinkDrive, iniciarUploadResumable, GoogleDriveNaoConectadoError } from "@/lib/google-drive";
import type { DocumentoCategoria } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const { clienteId, clienteNome, categoria, filename, mimeType } = body ?? {};

  if (
    typeof clienteId !== "string" ||
    typeof clienteNome !== "string" ||
    typeof categoria !== "string" ||
    typeof filename !== "string" ||
    typeof mimeType !== "string"
  ) {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }

  try {
    const linkDrive = await getClienteLinkDrive(clienteId);
    // Certificado digital (.pfx/.p12) fica solto na raiz da pasta do
    // cliente, junto do contrato — não dentro de "DOCS SÓCIO" como as
    // demais categorias dessa pasta (ex: procurações).
    const folderId =
      categoria === "Certificados"
        ? await ensureClienteFolder(clienteId, clienteNome, linkDrive)
        : await ensureCategoriaFolder(clienteId, clienteNome, categoria as DocumentoCategoria, linkDrive);
    const uploadUrl = await iniciarUploadResumable(folderId, filename, mimeType);
    return NextResponse.json({ ok: true, uploadUrl });
  } catch (err) {
    if (err instanceof GoogleDriveNaoConectadoError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Erro ao enviar o arquivo." }, { status: 502 });
  }
}
