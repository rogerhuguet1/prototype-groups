"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * En static export `redirect()` (server) no funciona, así que la home
 * redirige client-side. La app real vive en /grupos.
 */
export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/grupos");
  }, [router]);
  return (
    <main className="flex min-h-screen items-center justify-center text-rbx-text-secondary">
      <p>Redirigiendo a Grupos…</p>
    </main>
  );
}
