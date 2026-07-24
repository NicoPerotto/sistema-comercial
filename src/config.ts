/**
 * Configuración global del Sistema Comercial.
 * Permite cambiar el título de la marca, los subtítulos y el tema visual desde un único lugar.
 */
export const SITE_CONFIG = {
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
  // ─── TEMAS OSCUROS ────────────────────────────────────────────────
  // - 'theme-indigo'          → Azul Indigo corporativo
  // - 'theme-emerald'         → Verde Esmeralda (alimentos/eco)
  // - 'theme-violet'          → Violeta Moderno (boutiques/tecnología)
  // - 'theme-amber'           → Naranja/Ámbar (comidas/panaderías)
  // - 'theme-rose'            → Crimson Rose (moda/estética/chic)
  // - 'theme-cyber'           → Midnight Cyber (futurista/cyberlime)
  // - 'theme-gold'            → Golden Luxury (lujo/joyerías/chocolaterías)
  // ─── TEMAS CLAROS ─────────────────────────────────────────────────
  // - 'theme-nordic-light'    → Nordic Light (minimalista/limpio/claro)
  // - 'theme-corporate-white' → Corporate White (azul clásico/oficinas)
  // - 'theme-warm-sand'       → Warm Sand (orgánico/panaderías/cálido claro)
  // - 'theme-mint-fresh'      → Mint Fresh (salud/farmacias/bienestar)
  // - 'theme-lavender-soft'   → Lavender Soft (spa/belleza/relajación)
  // - 'theme-rose-light'      → Rose Light (florerías/confiterías/femenino)
  // - 'theme-forest-light'    → Forest Light (jardinería/viveros/natural)
  theme: "theme-nordic-light" as const,
};
