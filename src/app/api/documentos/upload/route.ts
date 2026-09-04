import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureCategoriaFolder, getClienteLinkDrive, uploadFileToDrive, GoogleDriveNaoConectadoError } from "@/lib/google-drive";
import type { DocumentoCategoria } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const clienteId = form.get("clienteId");
  const clienteNome = form.get("clienteNome");
  const categoria = form.get("categoria");
  const responsavelId = form.get("responsavelId");

  if (!(file instanceof File) || typeof clienteId !== "string" || typeof clienteNome !== "string" || typeof categoria !== "string") {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }

  try {
    const linkDrive = await getClienteLinkDrive(clienteId);
    const folderId = await ensureCategoriaFolder(clienteId, clienteNome, categoria as DocumentoCategoria, linkDrive);
    const bytes = await file.arrayBuffer();
    const drive = await uploadFileToDrive(folderId, file.name, file.type || "application/octet-stream", bytes);

    const id = `d-${Date.now()}`;
    const documento = {
      id,
      cliente_id: clienteId,
      nome: file.name,
      categoria,
      data_arquivo: new Date().toISOString().slice(0, 10),
      responsavel_id: typeof responsavelId === "string" && responsavelId ? responsavelId : null,
      tamanho: formatBytes(file.size),
      drive_file_id: drive.id,
      drive_link: drive.webViewLink,
    };

    const admin = createAdminClient();
    const { error } = await admin.from("documents").insert(documento);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 502 });

    return NextResponse.json({
      ok: true,
      documento: {
        id,
        clienteId,
        nome: documento.nome,
        categoria: documento.categoria,
        dataArquivo: documento.data_arquivo,
        responsavelId: documento.responsavel_id,
        tamanho: documento.tamanho,
        url: drive.webViewLink,
      },
    });
  } catch (err) {
    if (err instanceof GoogleDriveNaoConectadoError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Erro ao enviar o arquivo." }, { status: 502 });
  }
}
