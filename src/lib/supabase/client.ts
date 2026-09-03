import { createBrowserClient } from "@supabase/ssr";

/** Cliente Supabase pro navegador — usa a publishable key (segura de
 * expor, a segurança de verdade fica nas políticas de RLS do banco). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
