'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md
                            transition-all duration-300 animate-in slide-in-from-top-10 fade-in
                            pointer-events-auto min-w-[300px]
                            ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : ''}
                            ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' : ''}
                            ${toast.type === 'info' ? 'bg-primary/10 border-primary/20 text-primary' : ''}
                            ${toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' : ''}
                        `}
                    >
                        {/* Bullet matching type */}
                        <div className={`w-2 h-2 rounded-full shrink-0 animate-pulse
                            ${toast.type === 'success' ? 'bg-green-500' : ''}
                            ${toast.type === 'error' ? 'bg-red-500' : ''}
                            ${toast.type === 'info' ? 'bg-primary' : ''}
                            ${toast.type === 'warning' ? 'bg-amber-500' : ''}
                        `} />

                        <p className="text-sm font-bold tracking-tight">{toast.message}</p>

                        <button
                            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                            className="ml-auto p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
