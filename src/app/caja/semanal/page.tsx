'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import {
    Calendar,
    TrendingDown,
    TrendingUp,
    Save,
    History,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Wallet,
    CreditCard,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BreakdownItem {
    paymentMethodId: string;
    paymentMethodName: string;
    isArqueable: boolean;
    salesTotal: number;
    supplierPaymentsTotal: number;
    expectedTotal: number;
    realAmount: number;
}

export default function WeeklyClosurePage() {
    const { showToast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [draft, setDraft] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/weekly-closure/draft');
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setDraft(data);
            setBreakdown(data.breakdown.map((b: any) => ({
                ...b,
                realAmount: b.expectedTotal // Initialize real with expected
            })));

            const storedUser = localStorage.getItem('user');
            if (storedUser) setUser(JSON.parse(storedUser));
        } catch (error: any) {
            showToast(error.message || 'Error al cargar borrador', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRealAmountChange = (id: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setBreakdown(prev => prev.map(item =>
            item.paymentMethodId === id ? { ...item, realAmount: numValue } : item
        ));
    };

    const totalExpected = breakdown.reduce((acc, item) => acc + item.expectedTotal, 0);
    const totalReal = breakdown.reduce((acc, item) => acc + item.realAmount, 0);
    const totalDifference = totalReal - totalExpected;

    const handleSubmit = async () => {
        if (!user) return showToast('Debes estar logueado', 'error');
        if (!confirm('¿Estás seguro de cerrar la semana? Esta acción guardará el saldo y definirá el inicio de la próxima semana.')) return;

        setIsSaving(true);
        try {
            const res = await fetch('/api/weekly-closure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    startDate: draft.startDate,
                    endDate: draft.endDate,
                    breakdown,
                    totalExpected,
                    totalReal,
                    difference: totalDifference
                })
            });

            if (res.ok) {
                showToast('Cierre semanal guardado con éxito', 'success');
                router.push('/caja'); // Redirect to main caja
            } else {
                const err = await res.json();
                throw new Error(err.error || 'Error al guardar');
            }
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return (
        <div className="page-container animate-pulse space-y-8">
            <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full"></div>
            <div className="grid grid-cols-3 gap-6">
                <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
                <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
                <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
            </div>
            <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
        </div>
    );

    return (
        <main className="page-container">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/caja" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <ArrowLeft className="w-4 h-4 text-slate-500" />
                        </Link>
                        <h1 className="text-title text-2xl font-bold">Cierre Semanal de Fondos</h1>
                    </div>
                    <p className="text-subtitle">Consolidación de cajas diarias y pagos a proveedores</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/caja/semanal/historial" className="btn-secondary h-12 flex items-center justify-center">
                        <History className="w-5 h-5 mr-2" />
                        HISTORIAL
                    </Link>
                    <button onClick={handleSubmit} disabled={isSaving} className="btn-primary shadow-xl shadow-primary/20 h-12 px-8">
                        <Save className="w-5 h-5 mr-2" />
                        {isSaving ? 'GUARDANDO...' : 'CERRAR SEMANA'}
                    </button>
                </div>
            </header>

            {/* Top Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="card-premium h-full">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Período Auditado</p>
                            <p className="text-sm font-black">{new Date(draft.startDate).toLocaleDateString()} al {new Date(draft.endDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex gap-10 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Cajas Cerradas</span>
                            <span className="text-xl font-black">{draft.registersCount}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Estado</span>
                            <span className="badge-primary bg-emerald-100 text-emerald-700 border-emerald-200 w-fit mt-1">En Tiempo Real</span>
                        </div>
                    </div>
                </div>

                <div className={`card-premium h-full border-l-8 ${totalDifference >= 0 ? 'border-l-emerald-500 bg-emerald-50/30' : 'border-l-rose-500 bg-rose-50/30'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Balance General</p>
                            <h3 className={`text-4xl font-black ${totalDifference >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {totalDifference >= 0 ? '+' : ''}${totalDifference.toLocaleString()}
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-2 italic">Diferencia total entre lo esperado y lo real contado</p>
                        </div>
                        <div className={`p-3 rounded-2xl ${totalDifference >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {totalDifference >= 0 ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Table Section */}
            <div className="space-y-6">
                <div className="card-premium p-0 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest flex items-center gap-2">
                            <Wallet className="w-4 h-4" /> Arqueo Consolidado por Método
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="table-header pl-6">Método de Pago</th>
                                    <th className="table-header text-right">Ventas de la Semana</th>
                                    <th className="table-header text-right">Pago Proveedores</th>
                                    <th className="table-header text-right">Total Esperado</th>
                                    <th className="table-header text-center pr-6" style={{ width: '220px' }}>Real en Mano</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {breakdown.map((item) => (
                                    <tr key={item.paymentMethodId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                        <td className="px-6 py-5 font-bold text-slate-900 dark:text-white text-base">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.isArqueable ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {item.isArqueable ? <Wallet className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                                                </div>
                                                {item.paymentMethodName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right font-medium text-emerald-600 text-base">
                                            +${item.salesTotal.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5 text-right font-medium text-rose-600 text-base">
                                            -${item.supplierPaymentsTotal.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white text-lg">
                                            ${item.expectedTotal.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5 pr-6">
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                                                <input
                                                    type="number"
                                                    className={`w-full pl-8 pr-4 py-3 rounded-2xl border outline-none text-right font-black text-lg transition-all ${item.realAmount !== item.expectedTotal ? 'border-primary ring-4 ring-primary/10 bg-primary/5' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}
                                                    value={item.realAmount}
                                                    onChange={(e) => handleRealAmountChange(item.paymentMethodId, e.target.value)}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-900 text-white font-black">
                                <tr>
                                    <td className="px-6 py-8 text-sm uppercase tracking-widest text-slate-400">Balance Semanal Consolidado</td>
                                    <td className="px-6 py-8 text-right text-emerald-400 text-lg">+${breakdown.reduce((acc, i) => acc + i.salesTotal, 0).toLocaleString()}</td>
                                    <td className="px-6 py-8 text-right text-rose-400 text-lg">-${breakdown.reduce((acc, i) => acc + i.supplierPaymentsTotal, 0).toLocaleString()}</td>
                                    <td className="px-6 py-8 text-right text-3xl font-black">${totalExpected.toLocaleString()}</td>
                                    <td className="px-6 py-8 text-right pr-6 text-4xl font-black text-primary">${totalReal.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="mt-8 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                        <AlertCircle className="w-6 h-6 text-primary shrink-0" />
                        <p className="text-sm font-medium italic">Al confirmar el cierre, se registrarán estos valores finales y se dará inicio al próximo ciclo contable.</p>
                    </div>
                    <button onClick={handleSubmit} disabled={isSaving} className="btn-primary shadow-2xl shadow-primary/30 h-16 px-12 text-lg uppercase tracking-widest">
                        <CheckCircle2 className="w-6 h-6 mr-2" />
                        {isSaving ? 'PROCESANDO...' : 'CONFIRMAR Y CERRAR SEMANA'}
                    </button>
                </div>
            </div>

        </main>
    );
}
