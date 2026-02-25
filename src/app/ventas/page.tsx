'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';
import { RefreshCw, Plus, Eye, AlertTriangle, Search, Filter, X } from 'lucide-react';

interface Sale {
    id: string;
    total: number;
    status: string;
    type: string;
    auditLog: string | null;
    createdAt: string;
    user: { name: string; role: string; };
    paymentMethod?: { name: string; percentage: number; };
    items: { id: string; quantity: number; price: number; product: { name: string; }; }[];
}

export default function SalesHistoryPage() {
    const { showToast } = useToast();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');

    useEffect(() => { fetchSales(); }, []);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/sales');
            const data = await res.json();
            setSales(Array.isArray(data) ? data : []);
        } catch (error) {
            showToast('Error al cargar historial de ventas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getAuditStats = (auditLogStr: string | null) => {
        if (!auditLogStr) return { removedCount: 0 };
        try {
            const log = JSON.parse(auditLogStr);
            return { removedCount: Array.isArray(log) ? log.filter((e: any) => e.action === 'REMOVE').length : 0 };
        } catch { return { removedCount: 0 }; }
    };

    const filtered = sales.filter(s => {
        const matchSearch =
            s.id.slice(-6).toUpperCase().includes(search.toUpperCase()) ||
            s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            s.paymentMethod?.name?.toLowerCase().includes(search.toLowerCase()) ||
            String(s.total).includes(search);
        const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalVisible = filtered.filter(s => s.status === 'COMPLETED').reduce((sum, s) => sum + Number(s.total), 0);

    return (
        <main className="page-container">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-title text-2xl font-bold">Control de Ventas</h1>
                    <p className="text-subtitle">Historial auditado y gestión de transacciones</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchSales} disabled={loading} className="btn-secondary p-2.5" title="Actualizar">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <Link href="/ventas/nueva" className="btn-primary gap-2">
                        <Plus className="w-4 h-4" />
                        NUEVA VENTA
                    </Link>
                </div>
            </header>

            {/* Filters bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por ID, vendedor, método…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <div className="flex bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700 gap-0.5">
                    {([['ALL', 'Todos'], ['COMPLETED', 'Completados'], ['CANCELLED', 'Cancelados']] as const).map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => setStatusFilter(val)}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${statusFilter === val ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="card-premium p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                <th className="table-header text-left">Operación</th>
                                <th className="table-header text-left">Vendedor</th>
                                <th className="table-header text-right">Monto</th>
                                <th className="table-header text-center">Pago</th>
                                <th className="table-header text-center">Estado</th>
                                <th className="table-header text-center">Auditoría</th>
                                <th className="table-header text-center">Detalle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                                        {Array(7).fill(0).map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Filter className="w-10 h-10 opacity-20" />
                                            <p className="font-medium">Sin resultados para los filtros aplicados</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((sale, idx) => {
                                    const { removedCount } = getAuditStats(sale.auditLog);
                                    return (
                                        <tr key={sale.id} className={`table-row ${idx % 2 !== 0 ? 'bg-slate-50/50 dark:bg-slate-900/30' : ''}`}>
                                            {/* ID + Fecha */}
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-1 rounded font-bold">
                                                    #{sale.id.slice(-6).toUpperCase()}
                                                </span>
                                                <div className="text-[10px] text-slate-400 mt-1">
                                                    {new Date(sale.createdAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                                                </div>
                                            </td>

                                            {/* Vendedor */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                                                        {sale.user?.name?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-semibold">{sale.user?.name || 'Sistema'}</div>
                                                        <div className="text-[9px] text-slate-400 uppercase tracking-tighter">{sale.user?.role || '—'}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Monto */}
                                            <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">
                                                ${Number(sale.total).toLocaleString()}
                                            </td>

                                            {/* Pago */}
                                            <td className="px-6 py-4 text-center">
                                                {sale.paymentMethod ? (
                                                    <div className="inline-flex flex-col items-center gap-0.5">
                                                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{sale.paymentMethod.name}</span>
                                                        {sale.paymentMethod.percentage !== 0 && (
                                                            <span className={`text-[8px] font-bold ${sale.paymentMethod.percentage > 0 ? 'text-danger' : 'text-success'}`}>
                                                                {sale.paymentMethod.percentage > 0 ? '+' : ''}{sale.paymentMethod.percentage}%
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : <span className="text-[10px] text-slate-300">—</span>}
                                            </td>

                                            {/* Estado */}
                                            <td className="px-6 py-4 text-center">
                                                <span className={`badge ${sale.status === 'COMPLETED' ? 'badge-success' : 'badge-danger'}`}>
                                                    {sale.status === 'COMPLETED' ? 'Completado' : 'Cancelado'}
                                                </span>
                                            </td>

                                            {/* Auditoría */}
                                            <td className="px-6 py-4 text-center">
                                                {removedCount > 0 ? (
                                                    <span className="inline-flex items-center gap-1 badge badge-warning">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        {removedCount} quita{removedCount > 1 ? 's' : ''}
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-medium text-slate-400">Limpio</span>
                                                )}
                                            </td>

                                            {/* Detalle */}
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => setSelectedSale(sale)}
                                                    className="btn-ghost text-xs py-1.5 px-3 hover:bg-primary/10 hover:text-primary"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Ver
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table footer */}
                {!loading && filtered.length > 0 && (
                    <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between text-xs text-slate-400">
                        <span>{filtered.length} registro{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</span>
                        <span>
                            Total cobrado (completados): <span className="font-black text-slate-700 dark:text-slate-200 text-sm ml-1">${totalVisible.toLocaleString()}</span>
                        </span>
                    </div>
                )}
            </div>

            {/* ── Modal Detalle ── */}
            {selectedSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <header className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">Detalle de Operación</h3>
                                <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {selectedSale.id}</p>
                            </div>
                            <button onClick={() => setSelectedSale(null)} className="btn-ghost p-2">
                                <X className="w-5 h-5" />
                            </button>
                        </header>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <p className="text-[10px] font-bold text-primary/60 uppercase tracking-wider mb-1">Monto</p>
                                    <p className="text-2xl font-bold text-primary">${Number(selectedSale.total).toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Método</p>
                                    <p className="text-base font-bold">{selectedSale.paymentMethod?.name || 'Efectivo'}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo</p>
                                    <p className="text-base font-bold">{selectedSale.type}</p>
                                </div>
                            </div>

                            <div className="overflow-y-auto max-h-64 space-y-4 pr-1 custom-scrollbar">
                                <section>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Artículos en Carrito</h4>
                                    <div className="space-y-1.5">
                                        {selectedSale.items.map(item => (
                                            <div key={item.id} className="flex justify-between items-center px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                <span className="font-medium text-sm">{item.product.name}</span>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs text-slate-400">{item.quantity} uni.</span>
                                                    <span className="font-bold text-primary text-sm">${Number(item.price * item.quantity).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {selectedSale.auditLog && (
                                    <section>
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            Auditoría del Vendedor
                                        </h4>
                                        <div className="space-y-1.5">
                                            {(() => {
                                                try {
                                                    const log = JSON.parse(selectedSale.auditLog!);
                                                    if (!Array.isArray(log)) return null;
                                                    return log.map((entry: any, i: number) => (
                                                        <div key={i} className={`flex justify-between items-center px-4 py-2 rounded-lg text-xs ${entry.action === 'ADD' ? 'bg-success-subtle text-success-dark border border-success-light' : 'bg-danger-subtle text-danger-dark border border-danger-light'}`}>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black w-4">{entry.action === 'ADD' ? '+' : '−'}</span>
                                                                <span className="font-medium">{entry.productName}</span>
                                                            </div>
                                                            <span className="opacity-60 text-[9px]">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                                        </div>
                                                    ));
                                                } catch { return null; }
                                            })()}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>

                        <div className="px-6 pb-6 flex justify-end">
                            <button onClick={() => setSelectedSale(null)} className="btn-secondary px-8">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
