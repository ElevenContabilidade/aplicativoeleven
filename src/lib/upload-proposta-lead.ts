import { subirArquivoEmPedacos } from "@/lib/drive-chunk-upload";

/** Sobe a proposta comercial enviada a um lead pro Drive do escritório (via
 * /api/leads/anexar-proposta + upload em pedaços) e devolve o nome do
 * arquivo e o link do Drive, pra salvar em Lead.propostaNome/propostaUrl. */
export async function uploadPropostaLead(params: { file: File; leadId: string; leadNome: string }): Promise<{ nome: string; url: string }> {
  const iniciar = await fetch("/api/leads/anexar-proposta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leadId: params.leadId,
      leadNome: params.leadNome,
      filename: params.file.name,
      mimeType: params.file.type || "application/octet-stream",
    }),
  });
  const data = await iniciar.json();
  if (!data.ok) throw new Error(data.error ?? "Não foi possível enviar a proposta.");

  const arquivo = await subirArquivoEmPedacos(data.uploadUrl, params.file);
  return { nome: params.file.name, url: arquivo.webViewLink };
}
