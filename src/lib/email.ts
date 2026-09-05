export class EmailNaoConfiguradoError extends Error {
  constructor() {
    super("O envio de e-mail ainda não foi configurado (falta RESEND_API_KEY nas variáveis de ambiente).");
  }
}

/** URL absoluta do app — um e-mail não tem "página atual" pra resolver
 * caminhos relativos, então todo link precisa ser absoluto. */
export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://aplicativoeleven.vercel.app").replace(/\/$/, "");
}

export function logoUrl(): string {
  return `${appUrl()}/brand/eleven-logo-email.png`;
}

/** Envia um e-mail via Resend (mesmo provedor já usado no convite de
 * colaborador) — lança EmailNaoConfiguradoError se RESEND_API_KEY não
 * estiver configurada. */
export async function enviarEmail(params: { to: string; subject: string; html: string; text?: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new EmailNaoConfiguradoError();
  const from = process.env.RESEND_FROM_EMAIL || "Eleven Hub <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: params.to, subject: params.subject, html: params.html, text: params.text }),
  });
  if (!res.ok) {
    const texto = await res.text();
    let detalhe = texto;
    try {
      detalhe = JSON.parse(texto).message || texto;
    } catch {
      // resposta não era JSON — usa o texto cru mesmo
    }
    throw new Error(`Falha ao enviar e-mail (${res.status}): ${detalhe}`);
  }
}
