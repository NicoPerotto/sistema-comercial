'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';

import {
    Package, ShoppingCart, ShoppingBag, Tag, Star, Store, Sparkles, Coffee, Heart,
    Apple, Carrot, Beef, Drumstick, Milk, Croissant, Sandwich, Soup,
    Container, Popcorn, Candy, CupSoda, Wine, Beer, SprayCan, Scroll, Brush,
    PawPrint, Bone, Shirt, Gift, Stethoscope, Hammer, Smartphone, Pizza,
    IceCream, Cake, Zap, Lightbulb, Home, Search, Trash2, Pencil, Plus, Minus,
    ArrowLeft, X
} from 'lucide-react';

const AVAILABLE_ICONS: Record<string, any> = {
    Package,
    ShoppingCart,
    ShoppingBag,
    Tag,
    Star,
    Store,
    Sparkles,
    Coffee,
    Heart,
    Apple,
    Carrot,
    Meat: Beef,
    Chicken: Drumstick,
    Cheese: Pizza,
    Milk,
    Croissant,
    Baguette: Sandwich,
    Pasta: Soup,
    Can: Container,
    Snacks: Popcorn,
    Candy,
    Soda: CupSoda,
    Wine,
    Beer,
    Spray: SprayCan,
    Bucket: Container,
    Paper: Scroll,
    Brush,
    Paw: PawPrint,
    Bone,
    Shirt,
    Gift,
    Medicine: Stethoscope,
    Tools: Hammer,
    Tech: Smartphone,
    Pizza,
    IceCream,
    Cake,
    Zap,
    Lightbulb,
    Home,
    Search,
    Trash: Trash2,
    Edit: Pencil,
    Plus,
    Minus,
    ArrowLeft,
    X,
};

const Icon = ({ name, className = "w-5 h-5", fallback = Package }: { name: string, className?: string, fallback?: any }) => {
    const LucideIcon = AVAILABLE_ICONS[name] || fallback;
    return <LucideIcon className={className} />;
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
                        <Icon name="ArrowLeft" />
                    </Link>
                    <div>
                        <h1 className="text-title text-2xl font-bold">Categorías</h1>
                        <p className="text-subtitle">Gestiona las categorías de tus productos</p>
                    </div>
                </div>
                <button onClick={() => handleOpenModal()} className="btn-primary">
                    <Icon name="Plus" />
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
                                        <Icon name={cat.icon} className="w-6 h-6" />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-sm">{cat.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{cat.id.substring(0, 8)}</div>
                                </td>
                                <td className="px-6 py-4 text-right pr-6">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleOpenModal(cat)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                                            <Icon name="Edit" />
                                        </button>
                                        <button onClick={() => handleDelete(cat.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
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
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <header className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h2 className="text-xl font-bold">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Icon name="X" /></button>
                        </header>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Nombre de la Categoría</label>
                                <input required autoFocus type="text" placeholder="Ej: Bebidas" className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Seleccionar Icono</label>
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-100 dark:border-slate-800 rounded-lg">
                                    {Object.keys(AVAILABLE_ICONS).filter(k => AVAILABLE_ICONS[k] && k !== 'X' && k !== 'Trash' && k !== 'Edit' && k !== 'Plus' && k !== 'Minus' && k !== 'ArrowLeft' && k !== 'Search').map((iconName) => (
                                        <button key={iconName} type="button" onClick={() => setIcon(iconName)} className={`p-3 rounded-lg border flex items-center justify-center transition-all ${icon === iconName ? 'border-primary bg-primary text-white shadow-md' : 'border-slate-200 hover:border-primary/50 text-slate-400'}`}>
                                            <Icon name={iconName} className="w-6 h-6" />
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
