'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ArrowDownToLine, History, Printer } from 'lucide-react';

export default function CajaPage() {
    const [registerData, setRegisterData] = useState<any>(null);
    const [suggestedOpening, setSuggestedOpening] = useState(0);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchRegisterStatus();
    }, []);

    const fetchRegisterStatus = async () => {
        try {
            const res = await fetch('/api/cash-register');
            const data = await res.json();
            setRegisterData(data);
            if (data.status === 'CLOSED' && data.suggestedOpeningAmount) {
                setSuggestedOpening(data.suggestedOpeningAmount);
                setAmount(data.suggestedOpeningAmount.toString());
            }
        } catch (error) {
            console.error('Error fetching register status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = async (e: React.FormEvent) => {
        e.preventDefault();
        if (Number(amount) < suggestedOpening) {
            if (!confirm(`El monto inicial es menor al sugerido ($${suggestedOpening}). ¿Deseas continuar?`)) return;
        }
        try {
            const res = await fetch('/api/cash-register/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ openingAmount: amount, openedById: user.id }),
            });
            if (res.ok) { setAmount(''); fetchRegisterStatus(); }
        } catch (error) {
            console.error('Error opening register:', error);
        }
    };

    const handleClose = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/cash-register/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ closingAmount: amount, closedById: user.id }),
            });
            if (res.ok) {
                const data = await res.json();
                setRegisterData(data);
                setAmount('');
            }
        } catch (error) {
            console.error('Error closing register:', error);
        }
    };

    if (loading) return (
        <div className="p-10 flex flex-col gap-6 animate-pulse">
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl w-1/3"></div>
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl max-w-xl"></div>
        </div>
    );

    const isOpen = registerData && registerData.status === 'OPEN';
    const isRecentlyClosed = registerData && registerData.status === 'CLOSED' && registerData.shortId && registerData.closedAt;
    const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    return (
        <main className="page-container">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-title text-2xl font-bold">Caja Diaria</h1>
                    <p className="text-subtitle">Gestión de apertura y cierre de turno auditado</p>
                </div>
                {isAdminOrManager && (
                    <Link href="/caja/historial" className="btn-secondary gap-2">
                        <History className="w-4 h-4" />
                        Ver Historial
                    </Link>
                )}
            </header>

            {/* --- APERTURA --- */}
            {!isOpen && !isRecentlyClosed && (
                <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="card-premium relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-success"></div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-success-subtle dark:bg-success/10 text-success-dark rounded-xl flex items-center justify-center">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Apertura de Caja</h2>
                                <p className="text-sm text-slate-500">Fondo inicial para comenzar el turno</p>
                            </div>
                        </div>

                        <form onSubmit={handleOpen} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Monto Inicial (Efectivo)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">$</span>
                                    <input
                                        type="number"
                                        required
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 pl-10 text-3xl font-bold text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                {suggestedOpening > 0 && (
                                    <p className="text-xs text-success-dark font-medium">Sugerido del turno anterior: ${suggestedOpening}</p>
                                )}
                            </div>
                            <button type="submit" className="btn-primary w-full py-4 text-base">
                                INICIAR OPERACIONES
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- SESIÓN ACTIVA + FORMULARIO DE CIERRE --- */}
            {isOpen && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Session info */}
                    <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #2563eb 0%, transparent 60%)' }}></div>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Sesión Activa</h2>
                                <div className="text-5xl font-bold mt-2">#{registerData.shortId}</div>
                            </div>
                            <span className="flex h-3 w-3 mt-2">
                                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-success opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <p className="text-xs text-slate-400 mb-1">Responsable</p>
                                <p className="font-bold">{registerData.openedBy?.name}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <p className="text-xs text-slate-400 mb-1">Hora de Apertura</p>
                                <p className="font-bold">{new Date(registerData.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                            <p className="text-sm text-slate-400 mb-2">Fondo Inicial</p>
                            <p className="text-3xl font-bold">${Number(registerData.openingAmount).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Close form */}
                    <div className="card-premium relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-danger"></div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-danger-subtle dark:bg-danger/10 text-danger-dark rounded-xl flex items-center justify-center">
                                <ArrowDownToLine className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Cierre de Caja</h2>
                                <p className="text-sm text-slate-500">Conteo de efectivo y arqueo final</p>
                            </div>
                        </div>

                        <form onSubmit={handleClose} className="space-y-6">
                            <div className="bg-primary-subtle dark:bg-primary/10 p-4 rounded-xl text-primary-dark dark:text-primary text-sm">
                                Aparta <strong>${Number(registerData.openingAmount).toLocaleString()}</strong> para el próximo turno. Ingresá el total de efectivo contado.
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Efectivo Total Contado</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">$</span>
                                    <input
                                        type="number"
                                        required
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 pl-10 text-3xl font-bold outline-none focus:ring-2 focus:ring-danger"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn-danger w-full py-4 text-base">
                                FINALIZAR Y CERRAR
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- ARQUEO FINAL (tras cierre) --- */}
            {isRecentlyClosed && (
                <div className="max-w-4xl mx-auto animate-in zoom-in duration-500 space-y-8 pb-20">
                    <div className="card-premium p-0 overflow-hidden shadow-2xl">
                        <div className="bg-slate-900 p-10 text-white">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h1 className="text-4xl font-bold">Arqueo Final</h1>
                                    <p className="text-slate-400 mt-1">Sesión #{registerData.shortId} • Operación Exitosa</p>
                                </div>
                                <div className="text-center bg-white/10 p-4 rounded-xl border border-white/10">
                                    <p className="text-xs text-slate-400 uppercase">Fondo Base</p>
                                    <p className="text-2xl font-bold">${Number(registerData.openingAmount).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ventas por Método</h3>
                                    <div className="space-y-2">
                                        {Object.entries(registerData.breakdown || {}).map(([method, total]: [string, any]) => (
                                            <div key={method} className="flex justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <span className="font-medium">{method}</span>
                                                <span className="font-bold">${Number(total).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center mt-4">
                                            <span className="text-sm font-medium">Total Esperado</span>
                                            <span className="text-2xl font-bold">${Number(registerData.expectedAmount).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className={`p-6 rounded-xl border ${Number(registerData.difference) >= 0 ? 'bg-success-subtle border-success-light text-success-dark' : 'bg-danger-subtle border-danger-light text-danger-dark'}`}>
                                        <p className="text-xs font-bold uppercase mb-1">Diferencia</p>
                                        <p className="text-4xl font-bold">{Number(registerData.difference) >= 0 ? '+' : ''}${Number(registerData.difference).toLocaleString()}</p>
                                    </div>
                                    <div className="p-6 rounded-xl border border-primary-light bg-primary-subtle text-primary-dark">
                                        <p className="text-xs font-bold uppercase mb-1">Depositar en Caja Fuerte</p>
                                        <p className="text-4xl font-bold">${Number(registerData.depositAmount).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-center gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
                                <button onClick={() => window.print()} className="btn-secondary px-8 gap-2">
                                    <Printer className="w-4 h-4" />
                                    IMPRIMIR
                                </button>
                                <button onClick={() => { setRegisterData(null); fetchRegisterStatus(); }} className="btn-primary px-8">
                                    NUEVA APERTURA
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
