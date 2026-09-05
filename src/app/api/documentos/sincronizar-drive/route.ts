import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listarArquivosClienteDrive, getClienteLinkDrive, arquivoRemovidoOuNaLixeira, getEscopoConectado, GoogleDriveNaoConectadoError } from "@/lib/google-drive";
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

    // Um mesmo arquivo do Drive pode já estar cadastrado em OUTRO cliente
    // (ex: copiado/colado na pasta errada) — nesse caso não importa de
    // novo aqui, só avisa em vez de duplicar o documento.
    const idsEncontrados = arquivos.map(({ file }) => file.id);
    const donoDeOutroCliente = new Map<string, string>();
    if (idsEncontrados.length > 0) {
      const { data: outrosClientes } = await admin
        .from("documents")
        .select("drive_file_id, cliente_id")
        .in("drive_file_id", idsEncontrados)
        .neq("cliente_id", body.clienteId);
      for (const row of outrosClientes ?? []) {
        if (row.drive_file_id) donoDeOutroCliente.set(row.drive_file_id, row.cliente_id);
      }
    }
    let jaCadastradosEmOutroCliente: Array<{ arquivo: string; clienteId: string; clienteNome: string }> = [];
    if (donoDeOutroCliente.size > 0) {
      const outrosClienteIds = Array.from(new Set(donoDeOutroCliente.values()));
      const { data: clientesRows } = await admin
        .from("dados_financeiros")
        .select("id, data")
        .eq("tipo", "clients")
        .in("id", outrosClienteIds);
      const nomePorClienteId = new Map<string, string>();
      for (const row of clientesRows ?? []) {
        const cliente = row.data as { dados?: { nomeFantasia?: string; razaoSocial?: string } } | null;
        nomePorClienteId.set(row.id, cliente?.dados?.nomeFantasia ?? cliente?.dados?.razaoSocial ?? row.id);
      }
      jaCadastradosEmOutroCliente = arquivos
        .filter(({ file }) => donoDeOutroCliente.has(file.id))
        .map(({ file }) => {
          const outroClienteId = donoDeOutroCliente.get(file.id)!;
          return { arquivo: file.name, clienteId: outroClienteId, clienteNome: nomePorClienteId.get(outroClienteId) ?? outroClienteId };
        });
    }

    const novos = arquivos.filter(({ file }) => !porDriveId.has(file.id) && !donoDeOutroCliente.has(file.id));

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
      const escopoConectado = await getEscopoConectado().catch(() => null);
      return NextResponse.json({
        ok: true,
        importados: 0,
        removidos: idsParaRemover.length,
        reclassificados,
        jaCadastradosEmOutroCliente,
        clienteFolderId,
        resumoPastas,
        escopoConectado,
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
      jaCadastradosEmOutroCliente,
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
