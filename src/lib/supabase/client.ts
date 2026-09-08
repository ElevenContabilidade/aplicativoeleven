import { createBrowserClient } from "@supabase/ssr";

/** Toda escrita no app (checklists, cliente, financeiro etc.) é "dispara e
 * esquece": chama a action da store e segue em frente sem esperar a
 * confirmação do Supabase. Sem `keepalive`, um F5 ou fechar de aba logo em
 * seguida cancela essa requisição no meio do caminho — parece que salvou
 * (a tela já mostra o novo valor, otimista) mas nunca chegou no banco, e
 * some no próximo carregamento. `keepalive: true` deixa o navegador
 * terminar a requisição mesmo com a página saindo. */
function keepaliveFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, keepalive: true });
}

/** Cliente Supabase pro navegador — usa a publishable key (segura de
 * expor, a segurança de verdade fica nas políticas de RLS do banco). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { fetch: keepaliveFetch } }
  );
}
