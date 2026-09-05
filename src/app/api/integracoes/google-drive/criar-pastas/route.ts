import { NextResponse } from "next/server";
import { ensureAllCategoriaFolders, getClienteLinkDrive, GoogleDriveNaoConectadoError } from "@/lib/google-drive";

/** Chamado assim que um cliente novo é criado — cria de uma vez a pasta do
 * cliente e as 6 subpastas por setor no Drive (Licenças, Setor Fiscal, Setor
 * Contábil, Setor Pessoal, Docs Sócio, Docs Empresa), mesmo sem nenhum
 * documento enviado ainda. Melhor esforço: se o Drive não estiver conectado
 * isso não deve travar a criação do cliente, só fica pra sincronizar depois. */
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
    const linkDrive = await getClienteLinkDrive(body.clienteId);
    const { clienteFolderId, pastas } = await ensureAllCategoriaFolders(body.clienteId, body.clienteNome, linkDrive);
    return NextResponse.json({ ok: true, clienteFolderId, pastas });
  } catch (err) {
    if (err instanceof GoogleDriveNaoConectadoError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Erro ao criar pastas no Drive." }, { status: 502 });
  }
}
