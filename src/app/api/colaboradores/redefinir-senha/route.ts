import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Redefine a senha de um colaborador (usado no "reenviar convite" da tela
 * de Equipe). Precisa da secret key, então só roda no servidor. */
export async function POST(request: Request) {
  let body: { id?: string; senha?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }
  if (!body.id || !body.senha) {
    return NextResponse.json({ ok: false, error: "id e senha são obrigatórios." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(body.id, { password: body.senha });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
