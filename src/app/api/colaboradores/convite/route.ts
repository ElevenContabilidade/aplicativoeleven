import { NextResponse } from "next/server";

/** Envia o e-mail de convite de acesso (senha temporária) para um
 * colaborador recém-cadastrado. Depende de RESEND_API_KEY estar
 * configurada no ambiente (Vercel → Project Settings → Environment
 * Variables); sem ela, retorna configured:false e a tela de cadastro cai
 * no fallback de exibir as credenciais na tela pra repasse manual. */
export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ sent: false, configured: false });
  }

  let body: { nome?: string; email?: string; senha?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ sent: false, configured: true, error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { nome, email, senha } = body;
  if (!nome || !email || !senha) {
    return NextResponse.json({ sent: false, configured: true, error: "Nome, e-mail e senha são obrigatórios." }, { status: 400 });
  }

  const from = process.env.RESEND_FROM_EMAIL || "Eleven Hub <onboarding@resend.dev>";
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/login` : "/login";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#5C1420;">Bem-vindo(a) ao Eleven Hub, ${nome}!</h2>
      <p>Sua conta de acesso foi criada. Use as credenciais abaixo para entrar pela primeira vez:</p>
      <table style="margin: 16px 0; font-size: 14px;">
        <tr><td style="color:#8A8A8A; padding-right: 8px;">E-mail:</td><td><strong>${email}</strong></td></tr>
        <tr><td style="color:#8A8A8A; padding-right: 8px;">Senha temporária:</td><td><strong>${senha}</strong></td></tr>
      </table>
      <p>Por segurança, altere essa senha assim que acessar.</p>
      <p><a href="${loginUrl}" style="background:#5C1420; color:#fff; padding: 10px 18px; border-radius: 8px; text-decoration:none; display:inline-block;">Acessar o Eleven Hub</a></p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: email, subject: "Seu acesso ao Eleven Hub", html }),
    });
    if (!res.ok) {
      const detalhe = await res.text();
      return NextResponse.json({ sent: false, configured: true, error: detalhe }, { status: 502 });
    }
    return NextResponse.json({ sent: true, configured: true });
  } catch (err) {
    return NextResponse.json({ sent: false, configured: true, error: err instanceof Error ? err.message : "Erro desconhecido." }, { status: 502 });
  }
}
