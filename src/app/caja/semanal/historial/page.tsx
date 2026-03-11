'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import {
    Calendar,
    History,
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Wallet,
    CreditCard,
    FileText
} from 'lucide-react';
import Link from 'next/link';

interface ClosureItem {
    id: string;
    shortId: string;
    startDate: string;
    endDate: string;
    totalExpected: number;
    totalReal: number;
    difference: number;
    user: { name: string };
    details: any[];
}

export default function WeeklyClosureHistoryPage() {
    const { showToast } = useToast();
    const [closures, setClosures] = useState<ClosureItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<string[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/weekly-closure');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setClosures(data);
        } catch (error: any) {
            showToast(error.message || 'Error al cargar historial', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    if (loading) return (
        <div className="page-container animate-pulse space-y-4">
            <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full"></div>
            {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div>
            ))}
        </div>
    );

    return (
        <main className="page-container">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/caja/semanal" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <ArrowLeft className="w-4 h-4 text-slate-500" />
                        </Link>
                        <h1 className="text-title text-2xl font-bold">Historial de Cierres Semanales</h1>
                    </div>
                    <p className="text-subtitle">Auditoría de períodos contables cerrados</p>
                </div>
            </header>

            <div className="space-y-4">
                {closures.length === 0 ? (
                    <div className="card-premium text-center py-12 text-slate-500 italic">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        No hay cierres realizados todavía
                    </div>
                ) : closures.map((closure) => (
                    <div key={closure.id} className="card-premium p-0 overflow-hidden">
                        <div
                            className="p-6 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all flex flex-col md:flex-row justify-between items-center gap-4"
                            onClick={() => toggleExpand(closure.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                                    #{closure.shortId}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Período: {new Date(closure.startDate).toLocaleDateString()} al {new Date(closure.endDate).toLocaleDateString()}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Responsable: {closure.user.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-10">
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Total Real</p>
                                    <p className="text-xl font-black">${Number(closure.totalReal).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Diferencia</p>
                                    <p className={`text-xl font-black ${Number(closure.difference) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {Number(closure.difference) >= 0 ? '+' : ''}${Number(closure.difference).toLocaleString()}
                                    </p>
                                </div>
                                {expandedIds.includes(closure.id) ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                            </div>
                        </div>

                        {expandedIds.includes(closure.id) && (
                            <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Detalle por Método</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {closure.details.map((detail: any) => (
                                        <div key={detail.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold flex items-center gap-2">
                                                    {detail.paymentMethod.isArqueable ? <Wallet className="w-3 h-3 text-orange-500" /> : <CreditCard className="w-3 h-3 text-blue-500" />}
                                                    {detail.paymentMethod.name}
                                                </span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${Number(detail.difference) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {Number(detail.difference) >= 0 ? '+' : ''}{Number(detail.difference).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[9px] text-slate-400 uppercase tracking-tighter">Esperado</p>
                                                    <p className="text-xs font-bold text-slate-500">${Number(detail.expectedAmount).toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] text-slate-400 uppercase tracking-tighter">Real Contado</p>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white">${Number(detail.realAmount).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </main>
    );
}
