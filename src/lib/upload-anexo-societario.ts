import { subirArquivoEmPedacos } from "@/lib/drive-chunk-upload";

/** Sobe um documento anexado a um processo societário pro Drive do
 * escritório (via /api/societario/anexar-documento + upload em pedaços) e
 * devolve o nome do arquivo e o link do Drive, pra salvar em
 * ProcessoSocietario.anexos. */
export async function uploadAnexoSocietario(params: { file: File; processoId: string; processoNome: string }): Promise<{ nome: string; url: string }> {
  const iniciar = await fetch("/api/societario/anexar-documento", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      processoId: params.processoId,
      processoNome: params.processoNome,
      filename: params.file.name,
      mimeType: params.file.type || "application/octet-stream",
    }),
  });
  const data = await iniciar.json();
  if (!data.ok) throw new Error(data.error ?? "Não foi possível enviar o documento.");

  const arquivo = await subirArquivoEmPedacos(data.uploadUrl, params.file);
  return { nome: params.file.name, url: arquivo.webViewLink };
}
