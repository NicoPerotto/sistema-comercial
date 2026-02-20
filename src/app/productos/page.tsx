'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ToastProvider';
import * as XLSX from 'xlsx';
import Link from 'next/link';

const Icon = ({ children, className = "w-5 h-5" }: { children: React.ReactNode, className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        {children}
    </svg>
);

interface Category {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    categoryId: string;
    category?: Category;
    barcode?: string;
    description?: string;
    cost?: number;
    sellByWeight?: boolean;
}

export default function ProductsPage() {
    const { showToast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        price: '',
        stock: '',
        barcode: '',
        description: '',
        cost: '',
        sellByWeight: false
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/categories')
            ]);

            const productsData = await productsRes.json();
            const categoriesData = await categoriesRes.json();

            if (Array.isArray(productsData)) setProducts(productsData);
            if (Array.isArray(categoriesData)) setCategories(categoriesData);
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('Error al cargar datos del inventario', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExportExcel = () => {
        const exportData = products.map(p => ({
            'Nombre': p.name,
            'Código': p.barcode || '',
            'Categoría': p.category?.name || 'Sin Categoría',
            'Precio': p.price,
            'Costo': p.cost || 0,
            'Stock': p.stock
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Productos");
        XLSX.writeFile(wb, `Inventario_${new Date().toLocaleDateString()}.xlsx`);
        showToast('Excel generado con éxito', 'success');
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    showToast('El archivo está vacío', 'warning');
                    return;
                }

                setLoading(true);
                const res = await fetch('/api/products/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jsonData)
                });

                const result = await res.json();
                if (result.success) {
                    showToast(result.summary, 'success');
                    fetchData();
                } else {
                    showToast(result.error || 'Error al importar excel', 'error');
                }
            } catch (err) {
                console.error('Error reading excel:', err);
                showToast('Error al leer el archivo Excel', 'error');
            } finally {
                setLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleOpenModal = (product: any = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                categoryId: product.categoryId,
                price: product.price.toString(),
                stock: product.stock.toString(),
                barcode: product.barcode || '',
                description: product.description || '',
                cost: product.cost ? product.cost.toString() : '',
                sellByWeight: product.sellByWeight || false
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                categoryId: categories.length > 0 ? categories[0].id : '',
                price: '',
                stock: '',
                barcode: '',
                description: '',
                cost: '',
                sellByWeight: false
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const method = editingProduct ? 'PUT' : 'POST';
            const body = editingProduct ? { ...formData, id: editingProduct.id } : formData;

            const res = await fetch('/api/products', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setIsModalOpen(false);
                setFormData({ name: '', categoryId: '', price: '', stock: '', barcode: '', description: '', cost: '', sellByWeight: false });
                showToast(editingProduct ? 'Producto actualizado' : 'Producto creado', 'success');
                fetchData();
            } else {
                const error = await res.json();
                showToast(error.error || 'Error al guardar el producto', 'error');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            showToast('Error de conexión', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;

        try {
            const res = await fetch(`/api/products?id=${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                showToast('Producto eliminado', 'success');
                fetchData();
            } else {
                const error = await res.json();
                showToast(error.error || 'Error al eliminar el producto', 'error');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            showToast('Error de conexión', 'error');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.category?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search))
    );

    return (
        <main className="page-container">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-title text-2xl font-bold">Inventario</h1>
                    <p className="text-subtitle">Gestiona tus productos y existencias</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Icon className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></Icon>
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Link href="/categorias" className="btn-secondary" title="Gestionar Categorías">
                            <Icon className="w-5 h-5 text-primary"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></Icon>
                            <span className="hidden sm:inline">Categorías</span>
                        </Link>
                        <button onClick={handleExportExcel} className="btn-secondary" title="Exportar a Excel">
                            <Icon className="w-5 h-5 text-emerald-600"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></Icon>
                            <span className="hidden sm:inline">Exportar</span>
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" title="Importar desde Excel">
                            <Icon className="w-5 h-5 text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></Icon>
                            <span className="hidden sm:inline">Importar</span>
                        </button>
                    </div>

                    <button onClick={() => handleOpenModal()} className="btn-primary">
                        <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></Icon>
                        NUEVO PRODUCTO
                    </button>
                </div>
            </header>

            <div className="card-premium p-0 flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 z-10">
                            <tr>
                                <th className="table-header pl-6">Código</th>
                                <th className="table-header">Producto</th>
                                <th className="table-header">Categoría</th>
                                <th className="table-header text-right">Precio</th>
                                <th className="table-header text-center">Stock</th>
                                <th className="table-header text-right pr-6">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredProducts.length > 0 ? (
                                filteredProducts.map((p: any) => (
                                    <tr key={p.id} className="table-row">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                                                {p.barcode || p.id.substring(0, 8)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-sm">{p.name}</div>
                                            {p.description && <div className="text-xs text-slate-500 truncate max-w-xs">{p.description}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="badge-primary">
                                                {p.category?.name || 'Sin Categoría'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold">
                                            ${Number(p.price).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={Number(p.stock) <= 10 ? 'badge-danger' : 'badge-success'}>
                                                {Number(p.stock).toFixed(2)} {p.sellByWeight ? 'kg' : 'unid.'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right pr-6">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleOpenModal(p)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                                                    <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></Icon>
                                                </button>
                                                <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                                                    <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></Icon>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                                        No se encontraron productos
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
                        <header className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h2 className="text-xl font-bold">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Icon className="w-6 h-6"><path d="M6 18L18 6M6 6l12 12" /></Icon></button>
                        </header>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-sm font-medium">Nombre</label>
                                    <input required type="text" className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Categoría</label>
                                        <Link href="/categorias" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider">Gestionar</Link>
                                    </div>
                                    <select required className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary" value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                                        <option value="">Seleccionar...</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Código / Barcode</label>
                                    <input type="text" className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary" value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Precio</label>
                                    <input required type="number" step="0.01" className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary text-right" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Stock</label>
                                    <input required type="number" step="0.01" className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary text-right" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                                </div>
                                <div className="md:col-span-2 flex items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer" onClick={() => setFormData({ ...formData, sellByWeight: !formData.sellByWeight })}>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.sellByWeight ? 'bg-primary border-primary text-white' : 'border-slate-300'}`}>
                                        {formData.sellByWeight && <Icon className="w-3 h-3"><path d="M5 13l4 4L19 7" /></Icon>}
                                    </div>
                                    <span className="text-sm font-medium">Venta por peso (kg)</span>
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
