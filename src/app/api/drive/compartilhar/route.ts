import { NextResponse } from "next/server";
import { tornarArquivoPublico, GoogleDriveNaoConectadoError } from "@/lib/google-drive";

export async function POST(request: Request) {
  const body = await request.json();
  const { fileId } = body ?? {};

  if (typeof fileId !== "string") {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }

  try {
    await tornarArquivoPublico(fileId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof GoogleDriveNaoConectadoError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Erro ao compartilhar o arquivo." }, { status: 502 });
  }
}
