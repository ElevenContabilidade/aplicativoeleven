import { NextResponse } from "next/server";
import { ensureLeadFolder, iniciarUploadResumable, GoogleDriveNaoConectadoError } from "@/lib/google-drive";

export async function POST(request: Request) {
  const body = await request.json();
  const { leadId, leadNome, filename, mimeType } = body ?? {};

  if (typeof leadId !== "string" || typeof leadNome !== "string" || typeof filename !== "string" || typeof mimeType !== "string") {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }

  try {
    const folderId = await ensureLeadFolder(leadId, leadNome);
    const uploadUrl = await iniciarUploadResumable(folderId, filename, mimeType);
    return NextResponse.json({ ok: true, uploadUrl });
  } catch (err) {
    if (err instanceof GoogleDriveNaoConectadoError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Erro ao enviar o arquivo." }, { status: 502 });
  }
}
