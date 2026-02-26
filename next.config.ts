import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma client se mantiene en el servidor
  serverExternalPackages: ["@prisma/client"],

  // Deshabilitar datos de telemetría de Next.js (sin impacto funcional)
  experimental: {
  },

  // Cabeceras de caché para assets estáticos
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
      {
        // Cachear fuentes y assets estáticos por 1 año
        source: "/(.*)\\.(woff|woff2|ttf|otf|eot|ico|png|jpg|jpeg|webp|svg|gif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
