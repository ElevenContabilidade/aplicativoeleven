import { NextResponse } from "next/server";
import { ensureLeadFolder, uploadFileToDrive, GoogleDriveNaoConectadoError } from "@/lib/google-drive";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const leadId = form.get("leadId");
  const leadNome = form.get("leadNome");

  if (!(file instanceof File) || typeof leadId !== "string" || typeof leadNome !== "string") {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }

  try {
    const folderId = await ensureLeadFolder(leadId, leadNome);
    const bytes = await file.arrayBuffer();
    const drive = await uploadFileToDrive(folderId, file.name, file.type || "application/octet-stream", bytes);
    return NextResponse.json({ ok: true, nome: file.name, url: drive.webViewLink });
  } catch (err) {
    if (err instanceof GoogleDriveNaoConectadoError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Erro ao enviar o arquivo." }, { status: 502 });
  }
}
