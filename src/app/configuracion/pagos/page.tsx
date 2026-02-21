'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';

import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

const Icon = ({ name, className = "w-5 h-5" }: { name: string, className?: string }) => {
    const icons: Record<string, any> = {
        Plus,
        Edit: Pencil,
        Trash: Trash2,
        Check,
        X
    };
    const LucideIcon = icons[name] || Plus;
    return <LucideIcon className={className} />;
};


interface PaymentMethod {
    id: string;
    name: string;
    percentage: number;
    isArqueable: boolean;
}

export default function PaymentMethodsPage() {
    const { showToast } = useToast();
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', percentage: '', isArqueable: true });

    const fetchMethods = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/payment-methods');
            const data = await res.json();
            if (Array.isArray(data)) setMethods(data);
        } catch (error) {
            showToast('Error al cargar métodos de pago', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMethods();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const method = editingId ? 'PUT' : 'POST';
            const res = await fetch('/api/payment-methods', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingId ? { ...formData, id: editingId } : formData),
            });
            if (res.ok) {
                showToast(editingId ? 'Método actualizado' : 'Método creado', 'success');
                setIsModalOpen(false);
                fetchMethods();
            } else {
                const err = await res.json();
                showToast(err.error || 'Error al guardar', 'error');
            }
        } catch (error) {
            showToast('Error de conexión', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const deleteMethod = async (id: string) => {
        if (!confirm('¿Eliminar este método de pago?')) return;
        try {
            const res = await fetch(`/api/payment-methods?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Método eliminado', 'success');
                fetchMethods();
            }
        } catch (error) {
            showToast('Error de conexión', 'error');
        }
    };

    return (
        <main className="page-container">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-title text-2xl font-bold">Métodos de Pago</h1>
                    <p className="text-subtitle">Gestiona recargos, descuentos y arqueabilidad</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', percentage: '0', isArqueable: true });
                        setIsModalOpen(true);
                    }}
                    className="btn-primary"
                >
                    <Icon name="Plus" />
                    NUEVO MÉTODO
                </button>
            </header>

            <div className="card-premium p-0 overflow-hidden max-w-4xl mx-auto w-full">
                <table className="w-full text-left">
                    <thead>
                        <tr>
                            <th className="table-header pl-6">Nombre</th>
                            <th className="table-header">Tipo</th>
                            <th className="table-header">Modificador (%)</th>
                            <th className="table-header text-right pr-6">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={4} className="px-6 py-4"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-full"></div></td>
                                </tr>
                            ))
                        ) : methods.map(m => (
                            <tr key={m.id} className="table-row">
                                <td className="px-6 py-4 font-medium">{m.name}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${m.isArqueable ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {m.isArqueable ? 'ARQUEABLE' : 'DIGITAL'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-sm font-bold ${m.percentage > 0 ? 'text-red-500' : m.percentage < 0 ? 'text-green-500' : 'text-slate-500'}`}>
                                        {m.percentage > 0 ? `+${m.percentage}%` : m.percentage < 0 ? `${m.percentage}%` : '0%'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right pr-6">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => { setEditingId(m.id); setFormData({ name: m.name, percentage: m.percentage.toString(), isArqueable: m.isArqueable }); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary transition-colors">
                                            <Icon name="Edit" />
                                        </button>
                                        <button onClick={() => deleteMethod(m.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                                            <Icon name="Trash" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <header className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                            <h2 className="text-xl font-bold">{editingId ? 'Editar' : 'Nuevo'} Método</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Icon name="X" /></button>
                        </header>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Nombre</label>
                                <input required type="text" className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Porcentaje de Ajuste</label>
                                <div className="relative">
                                    <input required type="number" step="0.1" className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary text-right pr-8" value={formData.percentage} onChange={e => setFormData({ ...formData, percentage: e.target.value })} />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer" onClick={() => setFormData({ ...formData, isArqueable: !formData.isArqueable })}>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.isArqueable ? 'bg-primary border-primary text-white' : 'border-slate-300'}`}>
                                    {formData.isArqueable && <Icon name="Check" className="w-3 h-3" />}
                                </div>
                                <span className="text-sm font-medium">Método Arqueable (Efectivo)</span>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">CANCELAR</button>
                                <button type="submit" disabled={isSaving} className="btn-primary flex-1">{isSaving ? 'GUARDANDO...' : 'GUARDAR'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
