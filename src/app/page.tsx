import React from 'react';
import Link from 'next/link';
import { Plus, TrendingUp, ShoppingBag, AlertTriangle, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  return (
    <main className="page-container">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-title text-2xl font-bold">Panel de Control</h1>
          <p className="text-subtitle">Resumen general de tu sistema comercial</p>
        </div>
        <Link href="/ventas/nueva" className="btn-primary">
          <Plus className="w-5 h-5" />
          Nueva Venta
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Ventas Totales" value="$42.500" trend="+12.5%" Icon={TrendingUp} />
        <StatCard title="Transacciones" value="156" trend="+5.2%" Icon={ShoppingBag} />
        <StatCard title="Stock Bajo" value="12" trend="-2" Icon={AlertTriangle} warning />
        <StatCard title="Costos Fijos" value="$8.200" trend="Estable" Icon={BarChart3} />
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

function StatCard({ title, value, trend, Icon, warning = false }: { title: string, value: string, trend: string, Icon: any, warning?: boolean }) {
  return (
    <div className="card-premium flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-lg ${warning ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
          <Icon className="w-5 h-5" />
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
