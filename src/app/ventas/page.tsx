'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';

const Icon = ({ children, className = "w-5 h-5" }: { children: React.ReactNode, className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        {children}
    </svg>
);

interface Sale {
    id: string;
    total: number;
    status: string;
    type: string;
    auditLog: string | null;
    createdAt: string;
    user: {
        name: string;
        role: string;
    };
    paymentMethod?: {
        name: string;
        percentage: number;
    };
    items: {
        id: string;
        quantity: number;
        price: number;
        product: {
            name: string;
        };
    }[];
}

export default function SalesHistoryPage() {
    const { showToast } = useToast();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/sales');
            const data = await res.json();
            if (Array.isArray(data)) {
                setSales(data);
            } else {
                setSales([]);
            }
        } catch (error) {
            console.error('Error fetching sales:', error);
            showToast('Error al cargar historial de ventas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getAuditStats = (auditLogStr: string | null) => {
        if (!auditLogStr) return { removedCount: 0, addedCount: 0 };
        try {
            const log = JSON.parse(auditLogStr);
            const removed = Array.isArray(log) ? log.filter((entry: any) => entry.action === 'REMOVE').length : 0;
            const added = Array.isArray(log) ? log.filter((entry: any) => entry.action === 'ADD').length : 0;
            return { removedCount: removed, addedCount: added };
        } catch (e) {
            return { removedCount: 0, addedCount: 0 };
        }
    };

    return (
        <main className="page-container">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-title text-2xl font-bold">Control de Ventas</h1>
                    <p className="text-subtitle">Historial auditado y gestión de transacciones</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={fetchSales} className="btn-secondary">
                        <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></Icon>
                    </button>
                    <Link href="/ventas/nueva" className="btn-primary">
                        <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></Icon>
                        NUEVA VENTA
                    </Link>
                </div>
            </header>

            <div className="card-premium p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr>
                                <th className="table-header pl-6">Operación</th>
                                <th className="table-header">Vendedor</th>
                                <th className="table-header text-right">Monto</th>
                                <th className="table-header text-center">Pago</th>
                                <th className="table-header text-center">Estado</th>
                                <th className="table-header text-center">Auditoría</th>
                                <th className="table-header text-right pr-6">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-4"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : sales.length > 0 ? (
                                sales.map((sale) => {
                                    const { removedCount } = getAuditStats(sale.auditLog);
                                    return (
                                        <tr key={sale.id} className="table-row">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-sm">#{sale.id.slice(-6).toUpperCase()}</div>
                                                <div className="text-[10px] text-slate-400">{new Date(sale.createdAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-[10px] font-bold text-primary">
                                                        {sale.user?.name?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-semibold">{sale.user?.name || 'Sistema'}</div>
                                                        <div className="text-[9px] text-slate-400 uppercase tracking-tighter">{sale.user?.role || '---'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                                                ${Number(sale.total).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {sale.paymentMethod ? (
                                                    <div className="inline-flex flex-col items-center">
                                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{sale.paymentMethod.name}</span>
                                                        {sale.paymentMethod.percentage !== 0 && (
                                                            <span className={`text-[8px] font-bold ${sale.paymentMethod.percentage > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                                {sale.paymentMethod.percentage > 0 ? '+' : ''}{sale.paymentMethod.percentage}%
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] text-slate-300">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`badge ${sale.status === 'COMPLETED' ? 'badge-success' : 'badge-danger'}`}>
                                                    {sale.status === 'COMPLETED' ? 'Completado' : 'Cancelado'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {removedCount > 0 && (
                                                        <span className="badge badge-warning flex items-center gap-1">
                                                            {removedCount} QUITA
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] font-medium text-slate-400">Auditado</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right pr-6">
                                                <button
                                                    onClick={() => setSelectedSale(sale)}
                                                    className="p-2 text-slate-400 hover:text-primary transition-colors"
                                                >
                                                    <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></Icon>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-slate-400">
                                        No se encontraron ventas
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
                        <header className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">Detalle de Operación</h3>
                                <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {selectedSale.id}</p>
                            </div>
                            <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-slate-600">
                                <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></Icon>
                            </button>
                        </header>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <p className="text-[10px] font-bold text-primary/60 uppercase tracking-wider mb-1">Monto Cobrado</p>
                                    <p className="text-2xl font-bold text-primary">${Number(selectedSale.total).toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Método de Pago</p>
                                    <p className="text-lg font-bold">
                                        {selectedSale.paymentMethod?.name || 'Efectivo'}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo Venta</p>
                                    <p className="text-lg font-bold">{selectedSale.type}</p>
                                </div>
                            </div>

                            <div className="overflow-y-auto max-h-60 pr-2 custom-scrollbar">
                                <div className="space-y-4">
                                    <section>
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Artículos en Carrito</h4>
                                        <div className="space-y-2">
                                            {selectedSale.items.map(item => (
                                                <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <span className="font-medium text-sm">{item.product.name}</span>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs text-slate-400">{item.quantity} Uni.</span>
                                                        <span className="font-bold text-primary text-sm">${Number(item.price * item.quantity).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {selectedSale.auditLog && (
                                        <section>
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">Auditoría del Vendedor</h4>
                                            <div className="space-y-2">
                                                {(() => {
                                                    try {
                                                        const log = JSON.parse(selectedSale.auditLog);
                                                        if (!Array.isArray(log)) return null;
                                                        return log.map((entry: any, i: number) => (
                                                            <div key={i} className={`flex justify-between items-center p-3 rounded-lg text-xs ${entry.action === 'ADD'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                : 'bg-red-50 text-red-700 border border-red-100'
                                                                }`}>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold">{entry.action === 'ADD' ? '+' : '-'}</span>
                                                                    <span className="font-medium">{entry.productName}</span>
                                                                </div>
                                                                <span className="opacity-60">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                                            </div>
                                                        ));
                                                    } catch (e) { return null; }
                                                })()}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
