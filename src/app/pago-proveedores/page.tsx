'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';
import {
    Truck,
    Plus,
    X,
    Wallet,
    CreditCard,
    Banknote,
    History,
    FileText,
    UserCircle,
    ArrowRight,
    CheckCircle2
} from 'lucide-react';

interface Supplier {
    id: string;
    name: string;
}

interface PaymentMethod {
    id: string;
    name: string;
    isArqueable: boolean;
}

interface SupplierPayment {
    id: string;
    shortId: string;
    amount: number;
    description: string;
    paidFromCash: boolean;
    supplier: { name: string };
    paymentMethod: { name: string };
    user: { name: string };
    cashRegister?: { shortId: string };
    createdAt: string;
}

export default function SupplierPaymentsPage() {
    const { showToast } = useToast();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [recentPayments, setRecentPayments] = useState<SupplierPayment[]>([]);
    const [activeRegister, setActiveRegister] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [user, setUser] = useState<any>(null);

    const [formData, setFormData] = useState({
        supplierId: '',
        amount: '',
        paymentMethodId: '',
        description: '',
        paidFromCash: false,
        cashRegisterShortId: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [suppliersRes, methodsRes, paymentsRes, activeRegRes] = await Promise.all([
                fetch('/api/suppliers'),
                fetch('/api/payment-methods'),
                fetch('/api/supplier-payments'),
                fetch('/api/cash-register')
            ]);

            const [suppliersData, methodsData, paymentsData, activeRegData] = await Promise.all([
                suppliersRes.json(),
                methodsRes.json(),
                paymentsRes.json(),
                activeRegRes.json()
            ]);

            if (Array.isArray(suppliersData)) setSuppliers(suppliersData);
            if (Array.isArray(methodsData)) setPaymentMethods(methodsData);
            // Only show last 5 for employee reference
            if (Array.isArray(paymentsData)) setRecentPayments(paymentsData.slice(0, 5));
            if (activeRegData && !activeRegData.error) setActiveRegister(activeRegData);

            const storedUser = localStorage.getItem('user');
            if (storedUser) setUser(JSON.parse(storedUser));
        } catch (error) {
            showToast('Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const selectedMethod = paymentMethods.find(m => m.id === formData.paymentMethodId);
    const isArqueableSelection = selectedMethod?.isArqueable ?? false;

    const handleOpenModal = () => {
        const defaultMethod = paymentMethods.find(m => m.isArqueable) || paymentMethods[0];
        setFormData({
            supplierId: '',
            amount: '',
            paymentMethodId: defaultMethod?.id || '',
            description: '',
            paidFromCash: false,
            cashRegisterShortId: ''
        });
        setIsModalOpen(true);
    };

    const handleMethodChange = (id: string) => {
        const method = paymentMethods.find(m => m.id === id);
        setFormData({
            ...formData,
            paymentMethodId: id,
            paidFromCash: false
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            showToast('Debes estar logueado para registrar un pago', 'error');
            return;
        }

        if (formData.paidFromCash && activeRegister?.status !== 'OPEN') {
            showToast('No puedes pagar desde Caja Diaria porque no hay una caja abierta', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/supplier-payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    userId: user.id,
                    cashRegisterShortId: formData.paidFromCash ? (activeRegister?.shortId || '') : formData.cashRegisterShortId
                }),
            });

            if (res.ok) {
                const newPayment = await res.json();
                setIsModalOpen(false);
                showToast(`Pago ${newPayment.shortId} registrado con éxito`, 'success');
                fetchData();
            } else {
                const error = await res.json();
                showToast(error.error || 'Error al registrar pago', 'error');
            }
        } catch (error) {
            showToast('Error de conexión', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <main className="page-container">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-title text-2xl font-bold">Pago a Proveedores</h1>
                    <p className="text-subtitle">Módulo de registro de egresos por mercadería</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleOpenModal} className="btn-primary shadow-xl shadow-primary/20 h-12 px-8">
                        <Plus className="w-5 h-5 mr-2" />
                        REGISTRAR NUEVO PAGO
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                {/* Instruction / Action Card */}
                <div className="card-premium h-fit border-2 border-primary/10">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                            <Banknote className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Registro de Egresos</h3>
                            <p className="text-sm text-slate-500">Utiliza este módulo para rendir pagos realizados a proveedores. Asegúrate de vincular el código de caja si el dinero salió de una recaudación.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-sm">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <span>Los pagos registrados se vinculan automáticamente a tu usuario.</span>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-sm">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <span>Recuerda solicitar el comprobante del proveedor.</span>
                        </div>
                    </div>

                    <button
                        onClick={handleOpenModal}
                        className="w-full mt-8 py-4 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"
                    >
                        ABRIR FORMULARIO DE PAGO
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Local Session Feedback (Last 5 only) */}
                <div className="card-premium h-fit">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold flex items-center gap-2 text-slate-400 uppercase text-xs tracking-widest">
                            <History className="w-4 h-4" />
                            Tus Registros Recientes
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                            ))
                        ) : recentPayments.map(p => (
                            <div key={p.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                        <Truck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold truncate max-w-[150px]">{p.supplier.name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter">{p.shortId}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-900 dark:text-white">-${Number(p.amount).toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        ))}
                        {recentPayments.length === 0 && !loading && (
                            <div className="text-center py-12 px-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                                <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-xs text-slate-400 italic">No tienes pagos registrados en el historial cercano.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* New Payment Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 border border-white/20">
                        <header className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">Nuevo Egreso</h2>
                                <p className="text-xs text-slate-500 uppercase font-black tracking-widest mt-1">Formulario de Pago</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </header>
                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Proveedor</label>
                                    <select
                                        required
                                        className="w-full px-5 py-3.5 rounded-2xl border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:1.25em] bg-[right_1.25em_center] bg-no-repeat"
                                        value={formData.supplierId}
                                        onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                                    >
                                        <option value="">Seleccionar un proveedor...</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Monto</label>
                                    <div className="relative group">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 transition-colors group-focus-within:text-primary">$</span>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="w-full pl-10 pr-5 py-3.5 rounded-2xl border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-black text-xl"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Método de Pago</label>
                                    <select
                                        required
                                        className="w-full px-5 py-3.5 rounded-2xl border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:1.25em] bg-[right_1.25em_center] bg-no-repeat"
                                        value={formData.paymentMethodId}
                                        onChange={e => handleMethodChange(e.target.value)}
                                    >
                                        <option value="">Seleccionar método...</option>
                                        {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Referencia / Nota</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Factura A-001..."
                                        className="w-full px-5 py-3.5 rounded-2xl border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            {isArqueableSelection && (
                                <div className={`flex flex-col md:flex-row gap-6 p-6 rounded-3xl border transition-all ${activeRegister?.status !== 'OPEN' ? 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800' : 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100/50 dark:border-orange-900/20'}`}>
                                    <div className="flex items-center gap-4 flex-1">
                                        <div
                                            className={`w-14 h-7 rounded-full transition-all relative ${activeRegister?.status !== 'OPEN' ? 'bg-slate-200 cursor-not-allowed' : (formData.paidFromCash ? 'bg-orange-500 cursor-pointer' : 'bg-slate-300 cursor-pointer')}`}
                                            onClick={() => {
                                                if (activeRegister?.status === 'OPEN') {
                                                    setFormData({ ...formData, paidFromCash: !formData.paidFromCash });
                                                }
                                            }}
                                        >
                                            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${formData.paidFromCash ? 'left-8' : 'left-1'}`}></div>
                                        </div>
                                        <div>
                                            <p className={`text-sm font-black leading-tight ${activeRegister?.status !== 'OPEN' ? 'text-slate-400' : 'text-orange-900 dark:text-orange-400'}`}>
                                                {formData.paidFromCash ? 'EFECTIVO CAJA DIARIA' : 'EFECTIVO CAJA FUERTE'}
                                            </p>
                                            <p className="text-[10px] text-orange-700/60 dark:text-orange-500/60 mt-1 font-bold uppercase tracking-tighter">
                                                {activeRegister?.status !== 'OPEN'
                                                    ? 'Sin caja diaria abierta'
                                                    : (formData.paidFromCash ? 'Afecta cierre de hoy' : 'No afecta cierre')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-1 flex-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Código de Caja Vinculada</label>
                                        <input
                                            type="text"
                                            placeholder="EJ: AB123"
                                            disabled={formData.paidFromCash}
                                            className={`w-full px-4 py-2.5 rounded-xl border dark:bg-slate-800 outline-none focus:ring-4 focus:ring-orange-500/10 text-sm font-black font-mono uppercase transition-all ${formData.paidFromCash ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 text-slate-500' : 'bg-white border-orange-200 text-orange-600 shadow-sm shadow-orange-500/5'}`}
                                            value={formData.paidFromCash ? (activeRegister?.shortId || '') : formData.cashRegisterShortId}
                                            onChange={e => setFormData({ ...formData, cashRegisterShortId: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary h-14 flex-1 font-black text-sm uppercase tracking-widest">CANCELAR</button>
                                <button type="submit" disabled={isSaving} className="btn-primary h-14 flex-1 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20">
                                    {isSaving ? 'REGISTRANDO...' : 'REGISTRAR PAGO'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
