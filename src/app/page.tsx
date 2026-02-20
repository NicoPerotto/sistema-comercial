import React from 'react';
import Link from 'next/link';

// Common Icon Wrapper
const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>
);

export default function DashboardPage() {
  return (
    <main className="page-container">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-title text-2xl font-bold">Panel de Control</h1>
          <p className="text-subtitle">Resumen general de tu sistema comercial</p>
        </div>
        <Link href="/ventas/nueva" className="btn-primary">
          <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></Icon>
          Nueva Venta
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Ventas Totales" value="$42.500" trend="+12.5%" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />} />
        <StatCard title="Transacciones" value="156" trend="+5.2%" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />} />
        <StatCard title="Stock Bajo" value="12" trend="-2" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />} warning />
        <StatCard title="Costos Fijos" value="$8.200" trend="Estable" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />} />
      </div>

      {/* Recent Activity Table */}
      <div className="card-premium p-0 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold">Ventas Recientes</h3>
          <Link href="/ventas" className="text-sm font-medium text-primary hover:underline">Ver historial completo</Link>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="table-header pl-6">ID</th>
                <th className="table-header">Cliente / Cajero</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Fecha</th>
                <th className="table-header text-right pr-6">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <TableRow id="#V001" user="Juan Preventista" status="Completado" date="hace 2 min" amount="$1.500" />
              <TableRow id="#V002" user="Maria Vendedora" status="Pendiente" date="hace 15 min" amount="$2.800" />
              <TableRow id="#V003" user="Pedro Manager" status="Completado" date="hace 1 hora" amount="$12.400" />
              <TableRow id="#V004" user="Juan Preventista" status="Completado" date="hace 2 horas" amount="$450" />
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value, trend, icon, warning = false }: { title: string, value: string, trend: string, icon: React.ReactNode, warning?: boolean }) {
  return (
    <div className="card-premium flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-lg ${warning ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
          <Icon>{icon}</Icon>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'badge-success' : warning ? 'badge-danger' : 'badge-primary'}`}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
    </div>
  );
}

function TableRow({ id, user, status, date, amount }: { id: string, user: string, status: string, date: string, amount: string }) {
  return (
    <tr className="table-row group">
      <td className="px-6 py-4">
        <span className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
          {id}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="font-medium text-sm">{user}</div>
        <div className="text-xs text-slate-500">Venta Local</div>
      </td>
      <td className="px-6 py-4">
        <span className={status === 'Completado' ? 'badge-success' : 'badge-warning'}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="text-xs text-slate-500">{date}</div>
      </td>
      <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">{amount}</td>
    </tr>
  );
}
