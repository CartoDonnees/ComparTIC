/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dossier de compilation surchargeable (build ou serveur de test isolés, sans
  // toucher au `.next` du serveur de développement en cours).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  // Indicateur « route statique » du serveur de développement : son message
  // `isrManifest` fait planter le rechargement à chaud de Next (la page reste
  // alors bloquée sur l'écran de chargement). Il n'a aucun effet en
  // production ; il est désactivé pour fiabiliser le développement.
  devIndicators: false,
  // ESLint s'exécute pendant `next build` : les erreurs bloquent la
  // compilation (elles étaient auparavant ignorées, et ESLint n'était même
  // pas installé).
  eslint: {
    ignoreDuringBuilds: false,
  },
  // CORS : l'API était ouverte à toutes les origines (`*`). Elle n'est
  // désormais appelable que depuis les pages de la plateforme ; une origine
  // supplémentaire peut être autorisée via ALLOWED_ORIGIN.
  async headers() {
    const allowed = process.env.ALLOWED_ORIGIN;
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ];
    return [
      { source: "/:path*", headers: security },
      ...(allowed
        ? [
            {
              source: "/api/:path*",
              headers: [
                { key: "Access-Control-Allow-Origin", value: allowed },
                { key: "Access-Control-Allow-Credentials", value: "true" },
                { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
                { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
                { key: "Vary", value: "Origin" },
              ],
            },
          ]
        : []),
    ];
  },
};

export default nextConfig;
