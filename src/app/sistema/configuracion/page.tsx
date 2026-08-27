'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useSiteConfig } from '@/lib/use-site-config';
import { APP_THEMES } from '@/lib/themes';
import { Check } from 'lucide-react';

export default function BrandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { config, loading: loadingConfig, updateConfig } = useSiteConfig();

  const [brandName, setBrandName] = useState('');
  const [sidebarTitle, setSidebarTitle] = useState('');
  const [sidebarSubtitle, setSidebarSubtitle] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Guard: solo ADMIN
  useEffect(() => {
    if (!loading && user?.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [loading, user, router]);

  // Sincroniza el formulario con la config cargada
  useEffect(() => {
    if (!loadingConfig && config) {
      setBrandName(config.title || '');
      setSidebarTitle(config.sidebar.title || '');
      setSidebarSubtitle(config.sidebar.subtitle || '');
      setSelectedTheme(config.theme || 'warm-sand');
    }
  }, [loadingConfig, config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const ok = await updateConfig({
        brandName,
        sidebarTitle,
        sidebarSubtitle,
        theme: selectedTheme,
      });
      if (ok) {
        setSuccess(true);
        // Aplica el tema en vivo al <html> sin recargar (evita race con el fetch)
        const html = document.documentElement;
        html.className = html.className
          .split(' ')
          .filter((c) => !c.startsWith('theme-'))
          .concat(`theme-${selectedTheme}`)
          .join(' ');
        // El nombre/sidebar del layout es server-side; recargamos para reflejarlos
        setTimeout(() => window.location.reload(), 700);
      } else {
        setError('No se pudo guardar la configuración. Reintentá.');
      }
    } catch {
      setError('Error de red al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading || user?.role !== 'ADMIN') {
    return (
      <main className="flex-1 flex flex-col p-6 lg:p-10 text-foreground">
        <p className="text-text-muted">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col p-6 lg:p-10 space-y-8 overflow-y-auto text-foreground">
      <header>
        <h1 className="text-4xl font-black tracking-tight text-primary">Configuración de Marca</h1>
        <p className="text-foreground/60 font-medium">
          Personalizá el nombre del sistema y el esquema de colores
        </p>
      </header>

      {error && (
        <div className="bg-danger-subtle text-danger border border-danger/20 px-4 py-3 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3 rounded-xl text-sm font-semibold">
          ¡Configuración guardada! Aplicando tema…
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Datos de marca */}
        <section className="glass p-6 rounded-3xl border border-border space-y-4">
          <h2 className="text-xl font-black text-primary uppercase italic tracking-tighter">Identidad</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Nombre del sistema (título)</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full bg-card/50 border border-border rounded-2xl p-3 font-bold text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="Ej: PPG Gestión Comercial"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Subtítulo del sidebar</label>
              <input
                type="text"
                value={sidebarSubtitle}
                onChange={(e) => setSidebarSubtitle(e.target.value)}
                className="w-full bg-card/50 border border-border rounded-2xl p-3 font-bold text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="Ej: Gestión Comercial"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Título corto del sidebar (logo)</label>
            <input
              type="text"
              value={sidebarTitle}
              onChange={(e) => setSidebarTitle(e.target.value)}
              className="w-full md:w-1/2 bg-card/50 border border-border rounded-2xl p-3 font-bold text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Ej: PPG"
            />
          </div>
        </section>

        {/* Selector de tema */}
        <section className="glass p-6 rounded-3xl border border-border space-y-4">
          <h2 className="text-xl font-black text-primary uppercase italic tracking-tighter">Esquema de colores</h2>
          <p className="text-sm text-text-muted">Elegí el tema visual. Se aplica a todo el sistema al guardar.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {APP_THEMES.map((t) => {
              const isActive = selectedTheme === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setSelectedTheme(t.id)}
                  className={`theme-${t.id} relative rounded-2xl border-2 p-3 text-left transition-all ${isActive ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/40'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary border border-black/10" />
                    <span className="w-6 h-6 rounded-full bg-primary-dark border border-black/10" />
                    <span className="w-6 h-6 rounded-full bg-accent border border-black/10" />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-wide text-foreground leading-tight">{t.label}</p>
                  {isActive && (
                    <span className="absolute top-2 right-2 bg-primary text-white rounded-full p-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Preview en vivo del tema seleccionado */}
        <section className={`rounded-3xl border border-border p-6 theme-${selectedTheme}`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-text-faint mb-4">Vista previa del tema</p>
          <div className="bg-background text-foreground rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black">PP</div>
              <div>
                <h3 className="text-lg font-black text-foreground leading-none">{sidebarTitle || 'PPG'}</h3>
                <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mt-0.5">{sidebarSubtitle || 'Gestión Comercial'}</p>
              </div>
            </div>
            <p className="text-sm text-text-muted">Tarjeta de ejemplo con el esquema de color seleccionado.</p>
            <div className="flex gap-3">
              <button type="button" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl font-black text-sm">Botón primario</button>
              <button type="button" className="bg-accent text-white px-4 py-2 rounded-xl font-black text-sm">Acento</button>
              <span className="bg-surface-alt text-text-muted px-4 py-2 rounded-xl font-bold text-sm">Secundario</span>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase italic tracking-tighter shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </main>
  );
}
