/**
 * Catálogo de ventanas del sidebar.
 * Cada entrada es una "pantalla" que el gestor de roles puede habilitar/ocultar.
 * El `path` debe coincidir con el href del Sidebar para que el filtrado funcione.
 */
export interface AppWindow {
  path: string;
  label: string;
  section: 'Inicio' | 'Operaciones' | 'Catálogo' | 'Administración' | 'Apariencia';
  /** Solo visible para ADMIN siempre (no se puede quitar). */
  adminOnly?: boolean;
}

export const APP_WINDOWS: AppWindow[] = [
  // Inicio
  { path: '/', label: 'Dashboard', section: 'Inicio' },

  // Operaciones
  { path: '/ventas/nueva', label: 'Nueva Venta', section: 'Operaciones' },
  { path: '/caja', label: 'Caja Diaria', section: 'Operaciones' },
  { path: '/pago-proveedores', label: 'Pago Proveedores', section: 'Operaciones' },

  // Catálogo
  { path: '/productos', label: 'Productos', section: 'Catálogo' },
  { path: '/categorias', label: 'Categorías', section: 'Catálogo' },
  { path: '/proveedores', label: 'Proveedores', section: 'Catálogo' },

  // Administración
  { path: '/metricas', label: 'Métricas', section: 'Administración' },
  { path: '/caja/semanal', label: 'Cierre Semanal', section: 'Administración' },
  { path: '/ventas', label: 'Historial de Ventas', section: 'Administración' },
  { path: '/pago-proveedores/historial', label: 'Historial de Pagos', section: 'Administración' },
  { path: '/caja/historial', label: 'Historial de Caja', section: 'Administración' },
  { path: '/empleados', label: 'Empleados', section: 'Administración' },
  { path: '/configuracion/pagos', label: 'Métodos de Pago', section: 'Administración' },

  // Apariencia (solo ADMIN siempre)
  { path: '/sistema/apariencia', label: 'Apariencia', section: 'Apariencia', adminOnly: true },
  { path: '/sistema/roles', label: 'Gestor de Roles', section: 'Apariencia', adminOnly: true },
];

/** Vistas base que todo rol (aun el más restrictivo) debería tener. */
export const DEFAULT_WINDOWS: string[] = [
  '/',
  '/ventas/nueva',
  '/productos',
];

export function getWindowLabels(paths: string[]): string[] {
  return APP_WINDOWS
    .filter((w) => paths.includes(w.path))
    .map((w) => w.label);
}
