import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Registra o documento no banco depois que o upload em pedaços pro Drive
 * já terminou (ver /api/documentos/upload + drive-chunk-upload.ts). */
export async function POST(request: Request) {
  const body = await request.json();
  const { clienteId, nome, categoria, responsavelId, tamanho, driveFileId, driveLink } = body ?? {};

  if (
    typeof clienteId !== "string" ||
    typeof nome !== "string" ||
    typeof categoria !== "string" ||
    typeof tamanho !== "string" ||
    typeof driveFileId !== "string" ||
    typeof driveLink !== "string"
  ) {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }

  const id = `d-${Date.now()}`;
  const documento = {
    id,
    cliente_id: clienteId,
    nome,
    categoria,
    data_arquivo: new Date().toISOString().slice(0, 10),
    responsavel_id: typeof responsavelId === "string" && responsavelId ? responsavelId : null,
    tamanho,
    drive_file_id: driveFileId,
    drive_link: driveLink,
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
      url: driveLink,
    },
  });
}
