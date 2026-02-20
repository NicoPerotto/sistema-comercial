'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Icon = ({ children, className = "w-5 h-5" }: { children: React.ReactNode, className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        {children}
    </svg>
);

export default function CajaPage() {
    const [registerData, setRegisterData] = useState<any>(null);
    const [suggestedOpening, setSuggestedOpening] = useState(0);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchRegisterStatus();
        fetchHistory();
    }, []);

    const fetchRegisterStatus = async () => {
        try {
            const res = await fetch('/api/cash-register');
            const data = await res.json();
            setRegisterData(data);
            if (data.status === 'CLOSED' && data.suggestedOpeningAmount) {
                setSuggestedOpening(data.suggestedOpeningAmount);
                if (!amount) setAmount(data.suggestedOpeningAmount.toString());
            }
        } catch (error) {
            console.error('Error fetching register status:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/cash-register/history');
            const data = await res.json();
            if (Array.isArray(data)) {
                setHistory(data);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
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
                body: JSON.stringify({
                    openingAmount: amount,
                    openedById: user.id
                }),
            });
            if (res.ok) {
                setAmount('');
                fetchRegisterStatus();
            }
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
                body: JSON.stringify({
                    closingAmount: amount,
                    closedById: user.id
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setRegisterData(data);
                setAmount('');
                fetchHistory();
            }
        } catch (error) {
            console.error('Error closing register:', error);
        }
    };

    if (loading) return <div className="p-10 animate-pulse text-slate-400 font-medium">Cargando Estado de Caja...</div>;

    const isOpen = registerData && registerData.status === 'OPEN';
    const isRecentlyClosed = registerData && registerData.status === 'CLOSED' && registerData.shortId;

    return (
        <main className="page-container">
            <header>
                <h1 className="text-title text-2xl font-bold">Caja Diaria</h1>
                <p className="text-subtitle">Gestión de aperturas, cierres y arqueos auditados</p>
            </header>

            {!isOpen && !isRecentlyClosed && (
                <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="card-premium relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 rounded-xl flex items-center justify-center">
                                <Icon className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></Icon>
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
                                    <p className="text-xs text-emerald-600 font-medium">Sugerido: ${suggestedOpening}</p>
                                )}
                            </div>

                            <button type="submit" className="btn-primary w-full py-4 text-base">
                                INICIAR OPERACIONES
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isOpen && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Sesión Activa</h2>
                                <div className="text-5xl font-bold mt-2">#{registerData.shortId}</div>
                            </div>
                            <span className="flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <p className="text-xs text-slate-400 mb-1">Responsable</p>
                                <p className="font-bold">{registerData.openedBy?.name}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <p className="text-xs text-slate-400 mb-1">Apertura</p>
                                <p className="font-bold">{new Date(registerData.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                            <p className="text-sm text-slate-400 mb-2">Fondo Inicial</p>
                            <p className="text-3xl font-bold">${Number(registerData.openingAmount).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="card-premium relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-xl flex items-center justify-center">
                                <Icon className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" /></Icon>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Cierre de Caja</h2>
                                <p className="text-sm text-slate-500">Conteo de efectivo y arqueo final</p>
                            </div>
                        </div>

                        <form onSubmit={handleClose} className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl text-blue-800 dark:text-blue-300 text-sm">
                                Se deben apartar <strong>${Number(registerData.openingAmount).toLocaleString()}</strong> para el próximo turno. Ingresa el total de efectivo restante.
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
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 pl-10 text-3xl font-bold outline-none focus:ring-2 focus:ring-red-500"
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
                                    <div className={`p-6 rounded-xl border ${Number(registerData.difference) >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                        <p className="text-xs font-bold uppercase mb-1">Diferencia</p>
                                        <p className="text-4xl font-bold">{Number(registerData.difference) >= 0 ? '+' : ''}${Number(registerData.difference).toLocaleString()}</p>
                                    </div>
                                    <div className="p-6 rounded-xl border border-blue-200 bg-blue-50 text-blue-800">
                                        <p className="text-xs font-bold uppercase mb-1">Depositar en Caja Fuerte</p>
                                        <p className="text-4xl font-bold">${Number(registerData.depositAmount).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-center gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
                                <button onClick={() => window.print()} className="btn-secondary px-8">IMPRIMIR</button>
                                <button onClick={() => { setRegisterData(null); fetchRegisterStatus(); }} className="btn-primary px-8">FINALIZAR</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <section className="space-y-6 pt-10 border-t border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold">Historial de Sesiones</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {history.map((session) => (
                        <div key={session.id} className="card-premium p-6 hover:border-primary cursor-pointer" onClick={() => setRegisterData(session)}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-xs font-bold text-primary">SESIÓN #{session.shortId}</p>
                                    <p className="text-xs text-slate-500">{new Date(session.closedAt).toLocaleDateString()}</p>
                                </div>
                                <span className={Number(session.difference) >= 0 ? 'badge-success' : 'badge-danger'}>
                                    {Number(session.difference) >= 0 ? 'OK' : 'FALTA'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm py-3 border-y border-slate-50 dark:border-slate-800 mb-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase">Fondo</p>
                                    <p className="font-bold">${Number(session.openingAmount).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase">Depositado</p>
                                    <p className="font-bold">${Number(session.depositAmount).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">Cerrado por: {session.closedBy?.name || 'Sistema'}</div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
