import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Cria um colaborador de verdade: usuário de login no Supabase Auth +
 * linha em `profiles`. Só roda aqui (servidor) porque precisa da secret
 * key — o navegador nunca tem essa chave. */
export async function POST(request: Request) {
  let body: {
    nome?: string;
    email?: string;
    celular?: string;
    perfil?: string;
    departamentos?: string[];
    senha?: string;
    avatarColor?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requisição inválida." }, { status: 400 });
  }

  const { nome, email, celular, perfil, departamentos, senha, avatarColor } = body;
  if (!nome || !email || !perfil || !senha) {
    return NextResponse.json({ ok: false, error: "Nome, e-mail, perfil e senha são obrigatórios." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return NextResponse.json(
      { ok: false, error: createError?.message ?? "Não foi possível criar o usuário." },
      { status: 502 }
    );
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    nome,
    email,
    celular: celular || null,
    perfil,
    departamentos: departamentos ?? [],
    avatar_color: avatarColor ?? "#5C1420",
    ativo: true,
  });
  if (profileError) {
    // Sem o perfil o usuário fica órfão (login sem dado nenhum) — desfaz.
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ ok: false, error: profileError.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, id: created.user.id });
}
