/**
 * Configuración de branding del sistema (lado servidor).
 *
 * Resuelve en tiempo de ejecución desde la DB (model SystemConfig).
 * Si no hay registro en DB, cae a SITE_CONFIG (defaults estáticos del repo).
 *
 * Uso en Server Components:
 *   import { getSiteConfig } from '@/lib/system-config';
 *   const config = await getSiteConfig();
 */
import { prisma } from '@/lib/db';
import { SITE_CONFIG, type SiteConfig } from '@/config';

/** Claves de tema válidas (catálogo de src/lib/themes.ts). */
const VALID_THEMES = [
  'indigo', 'emerald', 'violet', 'amber', 'rose', 'cyber', 'gold',
  'nordic-light', 'corporate-white', 'warm-sand', 'mint-fresh',
  'lavender-soft', 'rose-light', 'forest-light',
] as const;

export type ThemeId = (typeof VALID_THEMES)[number];

export function isValidTheme(theme: string | null | undefined): theme is ThemeId {
  return typeof theme === 'string' && VALID_THEMES.includes(theme as ThemeId);
}

/**
 * Obtiene la configuración de branding actual.
 * - Si existe un registro en SystemConfig, lo usa.
 * - Si no, cae a SITE_CONFIG.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const record = await prisma.systemConfig.findFirst();
    if (!record) {
      return SITE_CONFIG;
    }

    const theme = isValidTheme(record.theme) ? record.theme : SITE_CONFIG.theme;

    return {
      title: record.brandName || SITE_CONFIG.title,
      description: record.description || SITE_CONFIG.description,
      sidebar: {
        title: record.sidebarTitle || SITE_CONFIG.sidebar.title,
        subtitle: record.sidebarSubtitle || SITE_CONFIG.sidebar.subtitle,
      },
      theme,
    };
  } catch {
    return SITE_CONFIG;
  }
}
