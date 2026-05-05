/**
 * Stub del cliente Supabase.
 *
 * En Fase 0 NO se utiliza: el prototipo trabaja con datos mock y estado local.
 * Este módulo existe sólo para fijar la convención de variables de entorno y
 * dejar el punto de entrada listo para cuando se conecte Supabase real (Fase 1
 * del plan en CLAUDE.md §14).
 *
 * Cuando se active:
 *   - Reemplazar este stub por `createBrowserClient` de `@supabase/ssr`.
 *   - Server-side: `autoRefreshToken: false, persistSession: false`
 *     (estándar interno ROBOTIX, ver SKILLS.md §17).
 *   - La sesión llega vía Edge Function `lti_launch_bridge` (NO por sign-up).
 *   - NUNCA exponer service_role; vive sólo en Edge Functions.
 */

interface SupabaseEnv {
  url: string | undefined;
  publishableKey: string | undefined;
  configured: boolean;
}

export function readSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return {
    url: url || undefined,
    publishableKey: publishableKey || undefined,
    configured: Boolean(url && publishableKey),
  };
}

/** Lanzado desde código que asuma cliente Supabase configurado (Fase 1+). */
export function getSupabaseClientStub(): never {
  throw new Error(
    "Supabase no está conectado en Fase 0. " +
      "Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, " +
      "instala @supabase/ssr y reemplaza este stub.",
  );
}
