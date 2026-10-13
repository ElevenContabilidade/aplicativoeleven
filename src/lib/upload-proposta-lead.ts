/** Sobe a proposta comercial enviada a um lead pro Drive do escritório (via
 * /api/leads/anexar-proposta) e devolve o nome do arquivo e o link do Drive,
 * pra salvar em Lead.propostaNome/propostaUrl. */
export async function uploadPropostaLead(params: { file: File; leadId: string; leadNome: string }): Promise<{ nome: string; url: string }> {
  const form = new FormData();
  form.append("file", params.file);
  form.append("leadId", params.leadId);
  form.append("leadNome", params.leadNome);

  const res = await fetch("/api/leads/anexar-proposta", { method: "POST", body: form });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? "Não foi possível enviar a proposta.");
  return { nome: data.nome, url: data.url };
}
