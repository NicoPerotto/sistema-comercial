'use client';

/**
 * Hook cliente para leer/actualizar la configuración de branding.
 * Se comunica con la API /api/system-config.
 */
import { useState, useEffect } from 'react';
import { SITE_CONFIG, type SiteConfig } from '@/config';
import { isValidTheme } from '@/lib/system-config';

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig>(SITE_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/system-config');
        if (res.ok) {
          const data = await res.json();
          setConfig({
            title: data.brandName || SITE_CONFIG.title,
            description: data.description || SITE_CONFIG.description,
            sidebar: {
              title: data.sidebarTitle || SITE_CONFIG.sidebar.title,
              subtitle: data.sidebarSubtitle || SITE_CONFIG.sidebar.subtitle,
            },
            theme: isValidTheme(data.theme) ? data.theme : SITE_CONFIG.theme,
          });
        }
      } catch {
        /* queda en default */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const updateConfig = async (data: {
    brandName?: string;
    description?: string;
    sidebarTitle?: string;
    sidebarSubtitle?: string;
    theme?: string;
  }) => {
    try {
      const res = await fetch('/api/system-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const fresh = await res.json();
        setConfig({
          title: fresh.brandName || SITE_CONFIG.title,
          description: fresh.description || SITE_CONFIG.description,
          sidebar: {
            title: fresh.sidebarTitle || SITE_CONFIG.sidebar.title,
            subtitle: fresh.sidebarSubtitle || SITE_CONFIG.sidebar.subtitle,
          },
          theme: isValidTheme(fresh.theme) ? fresh.theme : SITE_CONFIG.theme,
        });
      }
      return res.ok;
    } catch {
      return false;
    }
  };

  return { config, loading, updateConfig };
}
