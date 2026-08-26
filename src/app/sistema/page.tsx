'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const Icon = ({ children, className = 'w-5 h-5' }: { children: React.ReactNode; className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>
);

export default function SystemPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading || user?.role !== 'ADMIN') {
    return (
      <main className="flex-1 flex flex-col p-6 lg:p-10 text-foreground">
        <p className="text-text-muted">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col p-6 lg:p-10 space-y-8 text-foreground">
      <header>
        <h1 className="text-4xl font-black tracking-tight text-primary">Sistema</h1>
        <p className="text-foreground/60 font-medium">Configuración general del sistema (solo administradores)</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/sistema/roles"
          className="glass p-6 rounded-3xl border border-border hover:border-primary/50 transition-all group relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Icon className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </Icon>
            </div>
            <h3 className="text-xl font-black text-primary uppercase italic tracking-tighter">Gestor de Roles</h3>
          </div>
          <p className="text-sm text-text-muted">
            Creá roles y definí qué ventanas puede ver cada uno. Incluye el rol OWNER con acceso total.
          </p>
        </Link>
      </div>

      <div className="bg-card/30 border border-border/30 rounded-2xl p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Próximamente</p>
        <p className="text-sm text-text-muted">
          Nombre de la aplicación y colores personalizados se agregarán en una próxima entrega dentro de este módulo.
        </p>
      </div>
    </main>
  );
}
