'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';
import {
    Users,
    UserPlus,
    Search,
    Trash2,
    Pencil,
    Plus,
    ArrowLeft,
    X,
    Phone,
    ChevronLeft
} from 'lucide-react';

interface Supplier {
    id: string;
    name: string;
    contact?: string;
}

export default function SuppliersPage() {
    const { showToast } = useToast();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [search, setSearch] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        contact: ''
    });

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/suppliers');
            const data = await res.json();
            if (Array.isArray(data)) setSuppliers(data);
        } catch (error) {
            showToast('Error al cargar proveedores', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleOpenModal = (supplier: Supplier | null = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name,
                contact: supplier.contact || ''
            });
        } else {
            setEditingSupplier(null);
            setFormData({
                name: '',
                contact: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const method = editingSupplier ? 'PUT' : 'POST';
            const body = editingSupplier ? { id: editingSupplier.id, ...formData } : formData;
            const res = await fetch('/api/suppliers', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setIsModalOpen(false);
                showToast(editingSupplier ? 'Proveedor actualizado' : 'Proveedor creado', 'success');
                fetchSuppliers();
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
        if (!confirm('¿Eliminar este proveedor?')) return;
        try {
            const res = await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Proveedor eliminado', 'success');
                fetchSuppliers();
            } else {
                const error = await res.json();
                showToast(error.error || 'Error al eliminar', 'error');
            }
        } catch (error) {
            showToast('Error de conexión', 'error');
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.contact && s.contact.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <main className="page-container">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/pago-proveedores" className="p-2 text-slate-400 hover:text-primary">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-title text-2xl font-bold">Proveedores</h1>
                        <p className="text-subtitle">Gestiona tu lista de proveedores habituales</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Search className="w-5 h-5" />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar proveedor..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button onClick={() => handleOpenModal()} className="btn-primary">
                        <Plus className="w-5 h-5" />
                        NUEVO PROVEEDOR
                    </button>
                </div>
            </header>

            <div className="card-premium p-0 flex-1 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr>
                            <th className="table-header pl-6">Nombre</th>
                            <th className="table-header">Contacto / Información</th>
                            <th className="table-header text-right pr-6">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={3} className="px-6 py-8"><div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-full"></div></td>
                                </tr>
                            ))
                        ) : filteredSuppliers.length > 0 ? (
                            filteredSuppliers.map((s) => (
                                <tr key={s.id} className="table-row">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                                {s.name[0].toUpperCase()}
                                            </div>
                                            <div className="font-bold text-sm">{s.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        {s.contact ? (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5" />
                                                {s.contact}
                                            </div>
                                        ) : (
                                            <span className="italic text-slate-300">Sin contacto cargado</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(s)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                                                <Pencil className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-6 py-20 text-center text-slate-400">
                                    {search ? 'No se encontraron proveedores para la búsqueda' : 'No hay proveedores registrados'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <header className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h2 className="text-xl font-bold">{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                        </header>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Nombre Completo / Razón Social</label>
                                <input required autoFocus type="text" placeholder="Ej: Distribuidora Central" className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Contacto / Teléfono / Notas</label>
                                <textarea placeholder="Ej: +54 9 11 1234-5678 - Atiende Martes y Jueves" className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary h-24 resize-none" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} />
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
