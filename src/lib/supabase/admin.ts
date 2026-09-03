import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Cliente Supabase com a secret key — acesso total, ignora RLS. Só pode
 * rodar em código de servidor (API routes), NUNCA importar num componente
 * client. Usado pra criar login de colaborador (Auth Admin API) e outras
 * operações administrativas. */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
