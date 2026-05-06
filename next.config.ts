import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // legacy/ contiene el prototipo viejo: Next no lo compila, solo está
  // como referencia. Excluido vía tsconfig.exclude y al no haber rutas.
};

export default nextConfig;
