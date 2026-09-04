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
    const { data: existentes } = await admin.from("documents").select("id, drive_file_id, categoria").eq("cliente_id", body.clienteId);
    const porDriveId = new Map<string, { id: string; categoria: string }>();
    for (const d of existentes ?? []) {
      if (d.drive_file_id) porDriveId.set(d.drive_file_id, { id: d.id, categoria: d.categoria });
    }

    const linkDrive = await getClienteLinkDrive(body.clienteId);
    const { clienteFolderId, arquivos, resumoPastas } = await listarArquivosClienteDrive(body.clienteId, body.clienteNome, linkDrive);
    const novos = arquivos.filter(({ file }) => !porDriveId.has(file.id));

    // Documentos já rastreados cujo arquivo sumiu do Drive (excluído de vez
    // ou movido pra lixeira) — some do Eleven Hub também.
    const idsParaRemover: string[] = [];
    for (const [driveFileId, doc] of porDriveId) {
      if (await arquivoRemovidoOuNaLixeira(driveFileId)) idsParaRemover.push(doc.id);
    }
    if (idsParaRemover.length > 0) {
      await admin.from("documents").delete().in("id", idsParaRemover);
    }

    // Documentos já rastreados cujo arquivo foi movido pra outra pasta no
    // Drive — atualiza a categoria pra bater com a pasta em que está agora.
    let reclassificados = 0;
    for (const { file, categoria } of arquivos) {
      const atual = porDriveId.get(file.id);
      if (atual && atual.categoria !== categoria && !idsParaRemover.includes(atual.id)) {
        await admin.from("documents").update({ categoria }).eq("id", atual.id);
        reclassificados++;
      }
    }

    if (novos.length === 0) {
      return NextResponse.json({
        ok: true,
        importados: 0,
        removidos: idsParaRemover.length,
        reclassificados,
        clienteFolderId,
        resumoPastas,
      });
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

    return NextResponse.json({
      ok: true,
      importados: linhas.length,
      removidos: idsParaRemover.length,
      reclassificados,
      clienteFolderId,
      resumoPastas,
    });
  } catch (err) {
    if (err instanceof GoogleDriveNaoConectadoError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Erro ao sincronizar com o Drive." }, { status: 502 });
  }
}
