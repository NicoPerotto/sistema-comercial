'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart, Package, History, Settings,
  User as UserIcon, LogOut, LayoutDashboard,
  ArrowRight, Sparkles, ShieldCheck
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const roleLabels: Record<string, string> = {
    'ADMIN': 'Administrador del Sistema',
    'MANAGER': 'Gerente de Sucursal',
    'SELLER': 'Vendedor / Operador',
    'PREVENTISTA': 'Preventista de Campo'
  };

  return (
    <main className="page-container max-w-6xl mx-auto">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-title text-2xl font-bold">
              ¡Hola, {user?.name || 'Usuario'}!
            </h1>
            <div className="flex items-center gap-2">
              <span className="badge-primary">
                <ShieldCheck className="w-3 h-3 mr-1" />
                {roleLabels[user?.role] || user?.role || 'Personal'}
              </span>
              <span className="text-xs text-slate-500 font-medium italic">Sesión activa correctamente</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
        {/* Sale Card */}
        <QuickActionCard
          title="Nueva Venta"
          description="Inicia una nueva transacción y escanea productos."
          href="/ventas/nueva"
          Icon={ShoppingCart}
          color="primary"
        />

        {/* Inventory Card */}
        <QuickActionCard
          title="Inventario"
          description="Gestiona productos, stock y categorías de venta."
          href="/productos"
          Icon={Package}
          color="emerald"
        />

        {/* Cash Register Card */}
        <QuickActionCard
          title="Caja Diaria"
          description="Apertura, cierre y arqueos de turno auditados."
          href="/caja"
          Icon={LayoutDashboard}
          color="amber"
        />

        {/* History Card */}
        <QuickActionCard
          title="Historial"
          description="Consulta ventas pasadas y estados de transacciones."
          href="/ventas"
          Icon={History}
          color="blue"
        />


        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <>
            <QuickActionCard
              title="Métricas"
              description="Análisis avanzado de rendimiento y rentabilidad."
              href="/metricas"
              Icon={Sparkles}
              color="purple"
            />
            <QuickActionCard
              title="Configuración"
              description="Ajustes de métodos de pago, usuarios y auditoría."
              href="/configuracion/pagos"
              Icon={Settings}
              color="slate"
            />
          </>
        )}
      </div>

      <footer className="mt-12 p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Seguridad del Sistema
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Recuerda que cada acción queda registrada bajo tu usuario. Mantén tu sesión segura y cierra la caja al finalizar tu turno.
          </p>
        </div>
        <button
          onClick={() => { localStorage.removeItem('user'); window.location.href = '/login'; }}
          className="btn-secondary text-red-600 hover:bg-red-50 hover:border-red-100 px-6 py-3"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión Segura
        </button>
      </footer>
    </main>
  );
}

function QuickActionCard({ title, description, href, Icon, color }: any) {
  const colorClasses: any = {
    primary: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white',
    emerald: 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    amber: 'bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
    blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
    slate: 'bg-slate-100 text-slate-600 group-hover:bg-slate-600 group-hover:text-white',
  };

  return (
    <Link href={href} className="card-premium group hover:shadow-lg hover:border-primary/20 transition-all flex flex-col gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${colorClasses[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-lg flex items-center justify-between">
          {title}
          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
}
