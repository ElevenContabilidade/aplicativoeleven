const CHUNK_SIZE = 3_145_728; // 3 MiB — múltiplo de 256 KiB (exigido pela API do Drive pra pedaços
// que não são o último) e seguro dentro do limite de corpo de requisição das functions do Vercel (~4.5MB).

/** Sobe um arquivo em pedaços pra uma sessão de upload "resumable" do Drive
 * já aberta no servidor (ver iniciarUploadResumable em google-drive.ts) e, ao
 * terminar, deixa o arquivo com link público. Existe porque arquivos reais
 * (propostas, contratos, digitalizações) costumam passar do limite de corpo
 * de requisição das functions serverless, então não dá pra mandar o arquivo
 * inteiro de uma vez só pro nosso backend. */
export async function subirArquivoEmPedacos(uploadUrl: string, file: File): Promise<{ id: string; webViewLink: string }> {
  const total = file.size;
  let start = 0;

  while (start < total) {
    const end = Math.min(start + CHUNK_SIZE, total) - 1;
    const chunk = file.slice(start, end + 1);
    const res = await fetch(`/api/drive/upload-chunk?uploadUrl=${encodeURIComponent(uploadUrl)}&start=${start}&end=${end}&total=${total}`, {
      method: "POST",
      body: chunk,
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? "Não foi possível enviar o arquivo pro Drive.");
    if (data.done) {
      await fetch("/api/drive/compartilhar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: data.id }),
      });
      return { id: data.id, webViewLink: data.webViewLink };
    }
    start = end + 1;
  }

  throw new Error("Não foi possível enviar o arquivo pro Drive.");
}
