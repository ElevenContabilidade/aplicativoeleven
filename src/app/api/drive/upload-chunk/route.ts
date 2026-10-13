import { NextResponse } from "next/server";

/** Repassa um pedaço de arquivo pra uma sessão de upload "resumable" já
 * aberta no Drive (ver iniciarUploadResumable). O Drive responde 308
 * enquanto faltam pedaços e 200/201 com o arquivo criado no último. */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const uploadUrl = searchParams.get("uploadUrl");
  const start = Number(searchParams.get("start"));
  const end = Number(searchParams.get("end"));
  const total = Number(searchParams.get("total"));

  if (!uploadUrl || Number.isNaN(start) || Number.isNaN(end) || Number.isNaN(total)) {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }

  const bytes = await request.arrayBuffer();

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Range": `bytes ${start}-${end}/${total}` },
    body: bytes,
  });

  if (res.status === 308) {
    return NextResponse.json({ ok: true, done: false });
  }
  if (res.ok) {
    const json = await res.json();
    return NextResponse.json({ ok: true, done: true, id: json.id, webViewLink: json.webViewLink });
  }

  const body = await res.text();
  return NextResponse.json({ ok: false, error: `Erro ao enviar pedaço do arquivo pro Drive (${res.status}): ${body}` }, { status: 502 });
}
