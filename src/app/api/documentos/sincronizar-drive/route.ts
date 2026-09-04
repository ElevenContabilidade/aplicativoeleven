import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listarArquivosClienteDrive, getClienteLinkDrive, GoogleDriveNaoConectadoError } from "@/lib/google-drive";
import { formatBytes } from "@/lib/utils";

export async function POST(request: Request) {
  let body: { clienteId?: string; clienteNome?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }
  if (!body.clienteId || !body.clienteNome) {
    return NextResponse.json({ ok: false, error: "clienteId e clienteNome são obrigatórios." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: existentes } = await admin.from("documents").select("drive_file_id").eq("cliente_id", body.clienteId);
    const conhecidos = new Set((existentes ?? []).map((d) => d.drive_file_id).filter(Boolean));

    const linkDrive = await getClienteLinkDrive(body.clienteId);
    const { clienteFolderId, arquivos, resumoPastas } = await listarArquivosClienteDrive(body.clienteId, body.clienteNome, linkDrive);
    const novos = arquivos.filter(({ file }) => !conhecidos.has(file.id));

    if (novos.length === 0) {
      return NextResponse.json({ ok: true, importados: 0, clienteFolderId, resumoPastas });
    }

    const linhas = novos.map(({ file, categoria }, i) => ({
      id: `d-drive-${file.id}-${Date.now()}-${i}`,
      cliente_id: body.clienteId,
      nome: file.name,
      categoria,
      data_arquivo: file.createdTime.slice(0, 10),
      responsavel_id: null,
      tamanho: file.size ? formatBytes(Number(file.size)) : "—",
      drive_file_id: file.id,
      drive_link: file.webViewLink,
    }));

    const { error } = await admin.from("documents").insert(linhas);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 502 });

    return NextResponse.json({ ok: true, importados: linhas.length, clienteFolderId, resumoPastas });
  } catch (err) {
    if (err instanceof GoogleDriveNaoConectadoError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Erro ao sincronizar com o Drive." }, { status: 502 });
  }
}
