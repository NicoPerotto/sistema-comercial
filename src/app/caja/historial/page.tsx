'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ChevronLeft, Archive, TrendingUp, TrendingDown,
    Printer, X, Search, ChevronDown, ChevronUp
} from 'lucide-react';

export default function CajaHistorialPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'closedAt', dir: 'desc' });

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/cash-register/history');
                const data = await res.json();
                if (Array.isArray(data)) setHistory(data);
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const handleSort = (key: string) => {
        setSortConfig(prev =>
            prev.key === key
                ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                : { key, dir: 'desc' }
        );
    };

    const filtered = history
        .filter(s =>
            `#${s.shortId} ${s.openedBy?.name} ${s.closedBy?.name}`
                .toLowerCase()
                .includes(search.toLowerCase())
        )
        .sort((a, b) => {
            const mul = sortConfig.dir === 'asc' ? 1 : -1;
            const av = sortConfig.key === 'closedAt' ? new Date(a.closedAt).getTime()
                : sortConfig.key === 'difference' ? Number(a.difference)
                    : sortConfig.key === 'depositAmount' ? Number(a.depositAmount)
                        : Number(a.openingAmount);
            const bv = sortConfig.key === 'closedAt' ? new Date(b.closedAt).getTime()
                : sortConfig.key === 'difference' ? Number(b.difference)
                    : sortConfig.key === 'depositAmount' ? Number(b.depositAmount)
                        : Number(b.openingAmount);
            return (av - bv) * mul;
        });

    const SortIcon = ({ col }: { col: string }) => {
        if (sortConfig.key !== col) return <ChevronDown className="w-3 h-3 opacity-30" />;
        return sortConfig.dir === 'asc'
            ? <ChevronUp className="w-3 h-3 text-primary" />
            : <ChevronDown className="w-3 h-3 text-primary" />;
    };

    const ThBtn = ({ col, children }: { col: string; children: React.ReactNode }) => (
        <button
            onClick={() => handleSort(col)}
            className="flex items-center gap-1 hover:text-primary transition-colors font-semibold text-xs uppercase tracking-wider"
        >
            {children}
            <SortIcon col={col} />
        </button>
    );

    return (
        <main className="page-container">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/caja" className="btn-ghost p-2 rounded-lg">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-title text-2xl font-bold">Historial de Caja</h1>
                        <p className="text-subtitle">Registro auditado de todas las sesiones cerradas</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por sesión o responsable…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-72"
                    />
                </div>
            </header>

            {/* Table */}
            <div className="card-premium p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                <th className="table-header text-left w-28">
                                    <ThBtn col="shortId">Sesión</ThBtn>
                                </th>
                                <th className="table-header text-left">
                                    <ThBtn col="closedAt">Fecha y Hora</ThBtn>
                                </th>
                                <th className="table-header text-left">Abierto por</th>
                                <th className="table-header text-left">Cerrado por</th>
                                <th className="table-header text-right">
                                    <ThBtn col="openingAmount">Fondo</ThBtn>
                                </th>
                                <th className="table-header text-right">
                                    <ThBtn col="depositAmount">Depositado</ThBtn>
                                </th>
                                <th className="table-header text-right">
                                    <ThBtn col="difference">Diferencia</ThBtn>
                                </th>
                                <th className="table-header text-center">Estado</th>
                                <th className="table-header text-center">Detalle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                                        {Array(9).fill(0).map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-400">
                                            <Archive className="w-12 h-12 opacity-20" />
                                            <p className="font-medium">Sin sesiones encontradas</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((session, idx) => {
                                    const diff = Number(session.difference);
                                    const ok = diff >= 0;
                                    const closedDate = new Date(session.closedAt);
                                    return (
                                        <tr
                                            key={session.id}
                                            className={`table-row ${idx % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-900/30'}`}
                                        >
                                            {/* Sesión */}
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-1 rounded font-bold">
                                                    #{session.shortId}
                                                </span>
                                            </td>

                                            {/* Fecha */}
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-800 dark:text-white">
                                                    {closedDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {new Date(session.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {' → '}
                                                    {closedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </td>

                                            {/* Abierto por */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-success-light text-success-dark text-[10px] font-black flex items-center justify-center flex-shrink-0">
                                                        {session.openedBy?.name?.[0] || '?'}
                                                    </div>
                                                    <span className="text-sm font-medium">{session.openedBy?.name || '—'}</span>
                                                </div>
                                            </td>

                                            {/* Cerrado por */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-danger-light text-danger-dark text-[10px] font-black flex items-center justify-center flex-shrink-0">
                                                        {session.closedBy?.name?.[0] || '?'}
                                                    </div>
                                                    <span className="text-sm font-medium">{session.closedBy?.name || 'Sistema'}</span>
                                                </div>
                                            </td>

                                            {/* Fondo */}
                                            <td className="px-6 py-4 text-right font-semibold text-slate-700 dark:text-slate-200">
                                                ${Number(session.openingAmount).toLocaleString()}
                                            </td>

                                            {/* Depositado */}
                                            <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                                                ${Number(session.depositAmount).toLocaleString()}
                                            </td>

                                            {/* Diferencia */}
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-black text-sm ${ok ? 'text-success-dark' : 'text-danger-dark'}`}>
                                                    {ok ? '+' : ''}${diff.toLocaleString()}
                                                </span>
                                            </td>

                                            {/* Estado */}
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full ${ok ? 'bg-success-light text-success-dark' : 'bg-danger-light text-danger-dark'}`}>
                                                    {ok
                                                        ? <TrendingUp className="w-3 h-3" />
                                                        : <TrendingDown className="w-3 h-3" />
                                                    }
                                                    {ok ? 'OK' : 'FALTA'}
                                                </span>
                                            </td>

                                            {/* Botón detalle */}
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => setSelected(session)}
                                                    className="btn-ghost text-xs font-semibold py-1.5 px-3 hover:bg-primary/10 hover:text-primary"
                                                >
                                                    Ver arqueo
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                {!loading && filtered.length > 0 && (
                    <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/30">
                        <span>{filtered.length} sesiones encontradas</span>
                        <span>
                            Total depositado: <span className="font-black text-slate-700 dark:text-slate-200 text-sm ml-1">
                                ${filtered.reduce((s, x) => s + Number(x.depositAmount), 0).toLocaleString()}
                            </span>
                        </span>
                    </div>
                )}
            </div>

            {/* ── Modal de Arqueo ── */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal header */}
                        <div className="bg-slate-900 p-8 text-white flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arqueo Detallado</p>
                                <h2 className="text-3xl font-bold mt-1">Sesión #{selected.shortId}</h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    {new Date(selected.closedAt).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Ventas por método */}
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ventas por Método</h3>
                                    {Object.entries(selected.breakdown || {}).map(([method, total]: [string, any]) => (
                                        <div key={method} className="flex justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <span className="text-sm font-medium">{method}</span>
                                            <span className="text-sm font-bold">${Number(total).toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between px-4 py-3 bg-slate-900 text-white rounded-lg mt-2">
                                        <span className="text-sm">Total Esperado</span>
                                        <span className="font-bold">${Number(selected.expectedAmount).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Resultado */}
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Resultado</h3>
                                    <div className={`p-5 rounded-xl ${Number(selected.difference) >= 0 ? 'bg-success-subtle text-success-dark' : 'bg-danger-subtle text-danger-dark'}`}>
                                        <p className="text-[10px] font-bold uppercase mb-1">Diferencia</p>
                                        <p className="text-3xl font-black">
                                            {Number(selected.difference) >= 0 ? '+' : ''}${Number(selected.difference).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="p-5 rounded-xl bg-primary-subtle text-primary-dark">
                                        <p className="text-[10px] font-bold uppercase mb-1">En Caja Fuerte</p>
                                        <p className="text-3xl font-black">${Number(selected.depositAmount).toLocaleString()}</p>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium pl-1 flex flex-col gap-0.5">
                                        <span>Abierto por: <span className="text-slate-600 dark:text-slate-300 font-bold">{selected.openedBy?.name || '—'}</span></span>
                                        <span>Cerrado por: <span className="text-slate-600 dark:text-slate-300 font-bold">{selected.closedBy?.name || 'Sistema'}</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className="px-8 pb-8 flex gap-3 justify-end">
                            <button onClick={() => setSelected(null)} className="btn-secondary">Cerrar</button>
                            <button onClick={() => window.print()} className="btn-primary gap-2">
                                <Printer className="w-4 h-4" />
                                Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
