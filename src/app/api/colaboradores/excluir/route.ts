import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Exclui o usuário de login de verdade no Supabase Auth (a linha em
 * `profiles` cai junto, por causa do ON DELETE CASCADE). Precisa da
 * secret key, então só roda aqui no servidor. */
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
  const { error } = await admin.auth.admin.deleteUser(body.id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
