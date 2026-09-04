import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listarArquivosClienteDrive, getClienteLinkDrive, arquivoRemovidoOuNaLixeira, GoogleDriveNaoConectadoError } from "@/lib/google-drive";
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
    const { data: existentes } = await admin.from("documents").select("id, drive_file_id").eq("cliente_id", body.clienteId);
    const conhecidos = new Set((existentes ?? []).map((d) => d.drive_file_id).filter(Boolean));

    const linkDrive = await getClienteLinkDrive(body.clienteId);
    const { clienteFolderId, arquivos, resumoPastas } = await listarArquivosClienteDrive(body.clienteId, body.clienteNome, linkDrive);
    const novos = arquivos.filter(({ file }) => !conhecidos.has(file.id));

    // Documentos já rastreados cujo arquivo sumiu do Drive (excluído de vez
    // ou movido pra lixeira) — some do Eleven Hub também.
    const paraChecar = (existentes ?? []).filter((d): d is { id: string; drive_file_id: string } => !!d.drive_file_id);
    const idsParaRemover: string[] = [];
    for (const doc of paraChecar) {
      if (await arquivoRemovidoOuNaLixeira(doc.drive_file_id)) idsParaRemover.push(doc.id);
    }
    if (idsParaRemover.length > 0) {
      await admin.from("documents").delete().in("id", idsParaRemover);
    }

    if (novos.length === 0) {
      return NextResponse.json({ ok: true, importados: 0, removidos: idsParaRemover.length, clienteFolderId, resumoPastas });
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

    return NextResponse.json({ ok: true, importados: linhas.length, removidos: idsParaRemover.length, clienteFolderId, resumoPastas });
  } catch (err) {
    if (err instanceof GoogleDriveNaoConectadoError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Erro ao sincronizar com o Drive." }, { status: 502 });
  }
}
