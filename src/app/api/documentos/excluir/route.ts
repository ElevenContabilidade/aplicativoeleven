import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteFileFromDrive } from "@/lib/google-drive";

export async function POST(request: Request) {
  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }
  if (!body.id) {
    return NextResponse.json({ ok: false, error: "id é obrigatório." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: doc } = await admin.from("documents").select("drive_file_id").eq("id", body.id).maybeSingle();
  if (doc?.drive_file_id) {
    await deleteFileFromDrive(doc.drive_file_id).catch((err) => console.error("Erro ao excluir arquivo no Drive:", err));
  }

  const { error } = await admin.from("documents").delete().eq("id", body.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 502 });

  return NextResponse.json({ ok: true });
}
