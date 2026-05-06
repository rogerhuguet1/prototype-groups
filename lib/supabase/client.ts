import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para el browser. Singleton lazy: se crea la primera vez
 * que se llama y se reutiliza en sucesivas llamadas dentro de la misma
 * pestaña.
 *
 * Usa la `publishable key` (segura para exponer en cliente). La `service_role`
 * jamás se usa aquí — su sitio son las Edge Functions.
 */
let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local",
    );
  }

  cachedClient = createClient(url, key);
  return cachedClient;
}
