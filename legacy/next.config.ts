import type { NextConfig } from "next";

/**
 * `NEXT_PUBLIC_BASE_PATH` la inyecta el workflow de GitHub Pages
 * (.github/workflows/deploy.yml) con el valor "/prototype-groups".
 * En `npm run dev` queda vacía y la app sirve en http://localhost:3000/.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Static export para que el bundle pueda servirse desde GitHub Pages.
  output: "export",
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
