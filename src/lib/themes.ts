/**
 * Catálogo de temas visuales disponibles para el sistema.
 * Cada tema es una clase CSS que define las variables de color.
 * Usado por el selector de tema en /sistema/configuracion.
 */
export interface AppTheme {
  id: string;
  label: string;
  /** Nombre de la clase CSS aplicada al <html> (ej. 'theme-indigo'). */
  className: string;
  /** Breve descripción para el selector. */
  description: string;
  /** Indicativo de tono: 'dark' | 'light' */
  tone: 'dark' | 'light';
}

export const APP_THEMES: AppTheme[] = [
  { id: 'indigo', label: 'Azul Indigo', className: 'theme-indigo', description: 'Corporativo / azul slate', tone: 'dark' },
  { id: 'emerald', label: 'Verde Esmeralda', className: 'theme-emerald', description: 'Alimentos / eco', tone: 'dark' },
  { id: 'violet', label: 'Violeta Moderno', className: 'theme-violet', description: 'Tecnología / neon', tone: 'dark' },
  { id: 'amber', label: 'Naranja Ámbar', className: 'theme-amber', description: 'Comidas / cálido', tone: 'dark' },
  { id: 'rose', label: 'Crimson Rose', className: 'theme-rose', description: 'Moda / estética', tone: 'dark' },
  { id: 'cyber', label: 'Midnight Cyber', className: 'theme-cyber', description: 'Futurista / cyberlime', tone: 'dark' },
  { id: 'gold', label: 'Golden Luxury', className: 'theme-gold', description: 'Lujo / joyería', tone: 'dark' },
  { id: 'nordic-light', label: 'Nordic Light', className: 'theme-nordic-light', description: 'Minimalista / claro', tone: 'light' },
  { id: 'corporate-white', label: 'Corporate White', className: 'theme-corporate-white', description: 'Oficinas / azul clásico', tone: 'light' },
  { id: 'warm-sand', label: 'Warm Sand', className: 'theme-warm-sand', description: 'Orgánico / cálido claro', tone: 'light' },
  { id: 'mint-fresh', label: 'Mint Fresh', className: 'theme-mint-fresh', description: 'Salud / farmacias', tone: 'light' },
  { id: 'lavender-soft', label: 'Lavender Soft', className: 'theme-lavender-soft', description: 'Spa / belleza', tone: 'light' },
  { id: 'rose-light', label: 'Rose Light', className: 'theme-rose-light', description: 'Florerías / confitería', tone: 'light' },
  { id: 'forest-light', label: 'Forest Light', className: 'theme-forest-light', description: 'Jardinería / viveros', tone: 'light' },
];

/** Lista de IDs de temas disponibles (para validación del input). */
export const THEME_IDS = APP_THEMES.map((t) => t.id);
