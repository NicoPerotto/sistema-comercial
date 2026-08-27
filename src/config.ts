/**
 * Configuración global del Sistema Comercial.
 * Permite cambiar el título de la marca, los subtítulos y el tema visual desde un único lugar.
 */
export interface SiteConfig {
  title: string;
  description: string;
  sidebar: {
    title: string;
    subtitle: string;
  };
  theme: string;
}

export const SITE_CONFIG: SiteConfig = {
  // Título principal en las pestañas del navegador
  title: "PPG Gestión Comercial",
  // Descripción general del sistema
  description: "Sistema avanzado de gestión comercial, stock y ventas",

  // ── Branding visual en Sidebar ──
  sidebar: {
    title: "PPG", // Título principal que se renderiza arriba a la izquierda
    subtitle: "Gestión Comercial", // Subtítulo secundario
  },

  // ── Selección del Tema Activo ──
  // El valor es el ID del tema (sin prefijo). El className aplicado es `theme-${theme}`.
  // Catálogo completo en src/lib/themes.ts
  //   TEMAS OSCUROS: indigo, emerald, violet, amber, rose, cyber, gold
  //   TEMAS CLAROS: nordic-light, corporate-white, warm-sand, mint-fresh,
  //                 lavender-soft, rose-light, forest-light
  theme: "warm-sand" as const,
};
