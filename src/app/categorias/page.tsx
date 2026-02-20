'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';

const Icon = ({ children, className = "w-5 h-5" }: { children: React.ReactNode, className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        {children}
    </svg>
);

const AVAILABLE_ICONS = {
    Package: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
    ShoppingCart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />,
    Tag: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
    ShoppingBag: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />,
    Star: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-1.503 1.884-2.305 1.283l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.802.601-2.605-.362-2.305-1.283l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
    Store: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    FastFood: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.5a5 5 0 11-7 0m7 0V13a2 2 0 10-4 0v2.5M3 15.5a5 5 0 117 0m-7 0V13a2 2 0 104 0v2.5M3 20h18" />,
    Sparkles: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />,
    Coffee: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />,
    Heart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
    Bakery: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20.618L7.584 19.8a1 1 0 01-.832-.985V15.5a1 1 0 011-1h8.5a1 1 0 011 1v3.315a1 1 0 01-.832.985L12 20.618z" />,
    Freeze: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20m10-10H2m17.5 7.5L4.5 4.5m15 0L4.5 19.5" />,
    Home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    Apple: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2c-1.5 0-3 1-3 3 0 2 2 3 3 5 1-2 3-3 3-5 0-2-1.5-3-3-3z M12 20c-4 0-7-3-7-7s3-7 7-7 7 3 7 7-3 7-7 7z" />,
    Carrot: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.5 3.5c-1.5-1.5-4-1.5-5.5 0L6 12.5c-1 1-1 2.5 0 3.5l2 2c1 1 2.5 1 3.5 0l9-9c1.5-1.5 1.5-4 0-5.5z M8.5 17.5l-3 3 M11.5 14.5l-2 2" />,
    Milk: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 2h10l1 4v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6l1-4z M7 8h10" />,
    Pizza: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11l-3 3 3 3 m-6-6l3 3-3 3 M12 3L3 20h18L12 3z" />,
    Meat: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.5 14.5c1.333-1.333 4.5-4.5 4.5-4.5s2.5-1.5 1-3-3-1-3-1l-4.5 4.5-3-3L11 8l2.5 2.5L11 13l2.5 2.5L11 18l2.5 2.5 3.5-3.5-1.5-2.5z M10 13l-4 4a2 2 0 000 2.828l.172.172a2 2 0 002.828 0L13 16" />,
    Fish: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 12s-4-4-10-4-10 4-10 4 4 4 10 4 10-4 10-4z M17 12a1 1 0 11-2 0 1 1 0 012 0z" />,
    IceCream: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a4 4 0 00-4 4v2a4 4 0 108 0V6a4 4 0 00-4-4z M12 14l-4 8h8l-4-8z" />,
    Cake: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12c0-4.97-4.03-9-9-9s-9 4.03-9 9m18 0v6c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-6m18 0H3m12-5l-3 3-3-3" />,
    Beer: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8h1a3 3 0 013 3v2a3 3 0 01-3 3h-1m-4 4H7a2 2 0 01-2-2V5a2 2 0 012-2h7a2 2 0 012 2v12a2 2 0 01-2 2z M7 8h9" />,
    Wine: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 2h8m-4 0v12m0 0a4 4 0 01-4 4h8a4 4 0 01-4-4m-6 4h12" />,
    Cleaning: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12m-8 4h16" />,
    Pets: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />,
    Tools: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M12 15a3 3 0 100-6 3 3 0 000 6z" />,
    Office: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L19 13" />,
    Tech: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />,
    Shirt: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7V3m0 4l-4-4m4 4l4-4M5 7L3 9v12h18V9l-2-2m-2 0h-2m-4 0H9m-2 0H5" />,
    Gift: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 8h14v13H5V8z" />,
    Medicine: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
};

interface Category {
    id: string;
    name: string;
    icon: string;
}

export default function CategoriesPage() {
    const { showToast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('Package');

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            if (Array.isArray(data)) setCategories(data);
        } catch (error) {
            showToast('Error al cargar categorías', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleOpenModal = (category: Category | null = null) => {
        if (category) {
            setEditingCategory(category);
            setName(category.name);
            setIcon(category.icon || 'Package');
        } else {
            setEditingCategory(null);
            setName('');
            setIcon('Package');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const method = editingCategory ? 'PUT' : 'POST';
            const body = editingCategory ? { id: editingCategory.id, name, icon } : { name, icon };
            const res = await fetch('/api/categories', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setIsModalOpen(false);
                showToast(editingCategory ? 'Categoría actualizada' : 'Categoría creada', 'success');
                fetchCategories();
            } else {
                const error = await res.json();
                showToast(error.error || 'Error al guardar', 'error');
            }
        } catch (error) {
            showToast('Error de conexión', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta categoría?')) return;
        try {
            const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Categoría eliminada', 'success');
                fetchCategories();
            } else {
                const error = await res.json();
                showToast(error.error || 'Error al eliminar', 'error');
            }
        } catch (error) {
            showToast('Error de conexión', 'error');
        }
    };

    return (
        <main className="page-container">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/productos" className="p-2 text-slate-400 hover:text-primary">
                        <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></Icon>
                    </Link>
                    <div>
                        <h1 className="text-title text-2xl font-bold">Categorías</h1>
                        <p className="text-subtitle">Gestiona las categorías de tus productos</p>
                    </div>
                </div>
                <button onClick={() => handleOpenModal()} className="btn-primary">
                    <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></Icon>
                    NUEVA CATEGORÍA
                </button>
            </header>

            <div className="card-premium p-0 max-w-4xl mx-auto w-full overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr>
                            <th className="table-header pl-6">Icono</th>
                            <th className="table-header">Nombre</th>
                            <th className="table-header text-right pr-6">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={3} className="px-6 py-4"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-full"></div></td>
                                </tr>
                            ))
                        ) : categories.map((cat) => (
                            <tr key={cat.id} className="table-row">
                                <td className="px-6 py-4">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-primary flex items-center justify-center">
                                        <Icon className="w-6 h-6">{(AVAILABLE_ICONS as any)[cat.icon] || AVAILABLE_ICONS.Package}</Icon>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-sm">{cat.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{cat.id.substring(0, 8)}</div>
                                </td>
                                <td className="px-6 py-4 text-right pr-6">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleOpenModal(cat)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                                            <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></Icon>
                                        </button>
                                        <button onClick={() => handleDelete(cat.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                                            <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></Icon>
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
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <header className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h2 className="text-xl font-bold">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Icon><path d="M6 18L18 6M6 6l12 12" /></Icon></button>
                        </header>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Nombre de la Categoría</label>
                                <input required autoFocus type="text" placeholder="Ej: Bebidas" className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Seleccionar Icono</label>
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-100 dark:border-slate-800 rounded-lg">
                                    {Object.keys(AVAILABLE_ICONS).map((iconName) => (
                                        <button key={iconName} type="button" onClick={() => setIcon(iconName)} className={`p-3 rounded-lg border flex items-center justify-center transition-all ${icon === iconName ? 'border-primary bg-primary text-white shadow-md' : 'border-slate-200 hover:border-primary/50 text-slate-400'}`}>
                                            <Icon className="w-6 h-6">{(AVAILABLE_ICONS as any)[iconName]}</Icon>
                                        </button>
                                    ))}
                                </div>
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
