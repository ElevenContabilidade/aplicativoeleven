import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { gerarSenhaTemporaria } from "@/lib/senha-temporaria";

const DEPARTAMENTOS_TODOS = [
  "Comercial",
  "Relacionamento",
  "Fiscal",
  "Contábil",
  "Pessoal",
  "Societário",
  "Financeiro",
  "Atendimento",
];

/**
 * Rota de uso único pra criar a primeira conta de Administrador no Supabase.
 * Existe porque a tela de Equipe (onde colaboradores são criados) já exige
 * ser Administrador pra criar alguém — sem essa rota não tem como nascer o
 * primeiro admin. Protegida por SETUP_SECRET; depois de usada uma vez pode
 * ser removida.
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret") ?? request.headers.get("x-setup-secret");
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const email = "kauanegomescontadora@gmail.com";
  const admin = createAdminClient();

  const { data: existingProfile } = await admin.from("profiles").select("id, email").eq("email", email).maybeSingle();
  if (existingProfile) {
    return NextResponse.json({ ok: false, error: "Essa conta de administrador já existe. Faça login normalmente." }, { status: 409 });
  }

  const senha = gerarSenhaTemporaria();
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
    nome: "Kauane Gomes",
    email,
    perfil: "Administrador",
    departamentos: DEPARTAMENTOS_TODOS,
    avatar_color: "#5C1420",
    ativo: true,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ ok: false, error: profileError.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, email, senha });
}
