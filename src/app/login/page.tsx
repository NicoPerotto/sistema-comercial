'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const Icon = ({ children, className = "w-5 h-5" }: { children: React.ReactNode, className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        {children}
    </svg>
);

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/');
                router.refresh();
            } else {
                setError(data.error || 'Credenciales incorrectas');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
            <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>

                    <header className="text-center mb-10">
                        <div className="w-16 h-16 bg-primary mx-auto rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 mb-6">
                            <Icon className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></Icon>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Bienvenido</h1>
                        <p className="text-sm text-slate-500">Ingresa tus credenciales para continuar</p>
                    </header>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm font-medium flex items-center gap-3">
                                <Icon className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></Icon>
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@sistema.com"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 h-12 text-sm font-bold uppercase tracking-wider"
                        >
                            {loading ? 'Ingresando...' : 'Entrar al Sistema'}
                        </button>
                    </form>

                    <footer className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PWA Comercial v1.1 • Sistema de Gestión</p>
                    </footer>
                </div>
            </div>
        </main>
    );
}
