'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';
import {
    Truck,
    Plus,
    Search,
    X,
    Wallet,
    CreditCard,
    Banknote,
    History,
    FileText,
    ChevronRight,
    AlertCircle,
    UserCircle,
    Calendar,
    ArrowRight
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
    const [payments, setPayments] = useState<SupplierPayment[]>([]);
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
        paidFromCash: false, // Default to false (Vault/Caja Fuerte)
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
            if (Array.isArray(paymentsData)) setPayments(paymentsData);
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
            // Even if arqueable, default to false (Vault) as per latest requirement
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
                    // If paidFromCash is true, API uses active register.
                    // If false, it uses the provided cashRegisterShortId if any.
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
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-title text-2xl font-bold">Pago a Proveedores</h1>
                    <p className="text-subtitle">Registra y controla los egresos de mercadería y servicios</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/proveedores" className="btn-secondary">
                        <UserCircle className="w-5 h-5 text-primary" />
                        GESTIONAR PROVEEDORES
                    </Link>
                    <button onClick={handleOpenModal} className="btn-primary">
                        <Plus className="w-5 h-5" />
                        NUEVO PAGO
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Summary Section */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="card-premium bg-gradient-to-br from-primary to-primary-dark text-white border-none">
                        <div className="flex justify-between items-start mb-4">
                            <Wallet className="w-10 h-10 opacity-50" />
                            <div className="text-right">
                                <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Total Pagado Hoy</p>
                                <h2 className="text-3xl font-black mt-1">
                                    ${payments
                                        .filter(p => new Date(p.createdAt).toLocaleDateString() === new Date().toLocaleDateString())
                                        .reduce((acc, p) => acc + Number(p.amount), 0)
                                        .toLocaleString()}
                                </h2>
                            </div>
                        </div>
                        <p className="text-[10px] opacity-70 italic">Calculado en base a los registros del día actual</p>
                    </div>

                    <div className="card-premium">
                        <h3 className="text-sm font-bold mb-4 uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <History className="w-4 h-4" />
                            Últimos Movimientos
                        </h3>
                        <div className="space-y-4">
                            {payments.slice(0, 5).map(p => (
                                <div key={p.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-primary border border-slate-100 dark:border-slate-800">
                                            <Banknote className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold truncate max-w-[120px]">{p.supplier.name}</p>
                                            <p className="text-[10px] text-slate-400">{p.shortId}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-red-500">-${Number(p.amount).toLocaleString()}</p>
                                        <p className="text-[9px] text-slate-400">{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))}
                            {payments.length === 0 && (
                                <p className="text-center py-6 text-slate-400 text-xs italic">No hay pagos registrados</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* List Section */}
                <div className="xl:col-span-2">
                    <div className="card-premium p-0 overflow-hidden h-full flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Historial Completo
                            </h3>
                            <button className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">Ver todo</button>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="table-header pl-6">Código</th>
                                        <th className="table-header">Fecha</th>
                                        <th className="table-header">Proveedor</th>
                                        <th className="table-header">Método</th>
                                        <th className="table-header text-right pr-6">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {loading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={5} className="px-6 py-4"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-full"></div></td>
                                            </tr>
                                        ))
                                    ) : payments.map(p => (
                                        <tr key={p.id} className="table-row">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 w-fit">
                                                        {p.shortId}
                                                    </span>
                                                    {p.cashRegister && (
                                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border flex items-center gap-1 w-fit ${p.cashRegister?.shortId === activeRegister?.shortId ? 'text-orange-600 bg-orange-50 border-orange-100' : 'text-slate-500 bg-slate-50 border-slate-100'}`}>
                                                            <Wallet className="w-2.5 h-2.5" />
                                                            {p.cashRegister?.shortId === activeRegister?.shortId ? 'CAJA ACTUAL' : `CAJA ${p.cashRegister?.shortId}`}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium">{new Date(p.createdAt).toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-sm">{p.supplier.name}</div>
                                                {p.description && <div className="text-[10px] text-slate-400 truncate max-w-xs">{p.description}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="badge-primary flex items-center gap-1 w-fit">
                                                    <CreditCard className="w-3 h-3" />
                                                    {p.paymentMethod.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right pr-6 font-black text-slate-900 dark:text-white">
                                                ${Number(p.amount).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {!loading && payments.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-slate-400 bg-slate-50/50 dark:bg-transparent">
                                                <Truck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                                No se han registrado pagos todavía
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Payment Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
                        <header className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <div>
                                <h2 className="text-xl font-bold">Registrar Pago a Proveedor</h2>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Nuevo Comprobante de Egreso</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                        </header>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium flex justify-between items-center">
                                        Seleccionar Proveedor
                                        <Link href="/proveedores" className="text-[10px] text-primary hover:underline font-bold uppercase tracking-tighter">Gestionar Lista</Link>
                                    </label>
                                    <select
                                        required
                                        className="w-full px-4 py-2.5 rounded-lg border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary h-[46px]"
                                        value={formData.supplierId}
                                        onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                                    >
                                        <option value="">Seleccionar un proveedor...</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Monto a Abonar</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            className="w-full pl-8 pr-4 py-2.5 rounded-lg border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary font-bold text-lg"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Método de Pago</label>
                                    <select
                                        required
                                        className="w-full px-4 py-2.5 rounded-lg border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary h-[46px]"
                                        value={formData.paymentMethodId}
                                        onChange={e => handleMethodChange(e.target.value)}
                                    >
                                        <option value="">Seleccionar método...</option>
                                        {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Descripción / Observaciones</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Pago factura #4502"
                                        className="w-full px-4 py-2.5 rounded-lg border dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary h-[46px]"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            {isArqueableSelection && (
                                <div className={`flex flex-col md:flex-row gap-6 p-4 rounded-xl border transition-all ${activeRegister?.status !== 'OPEN' ? 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800' : 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/20'}`}>
                                    <div className="flex items-center gap-3 flex-1">
                                        <div
                                            className={`w-12 h-6 rounded-full transition-all relative ${activeRegister?.status !== 'OPEN' ? 'bg-slate-200 cursor-not-allowed' : (formData.paidFromCash ? 'bg-orange-500 cursor-pointer' : 'bg-slate-300 cursor-pointer')}`}
                                            onClick={() => {
                                                if (activeRegister?.status === 'OPEN') {
                                                    setFormData({ ...formData, paidFromCash: !formData.paidFromCash });
                                                }
                                            }}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.paidFromCash ? 'left-7' : 'left-1'}`}></div>
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold leading-none ${activeRegister?.status !== 'OPEN' ? 'text-slate-400' : 'text-orange-900 dark:text-orange-400'}`}>
                                                {formData.paidFromCash ? 'Pago desde Caja Diaria' : 'Pago desde Caja Fuerte'}
                                            </p>
                                            <p className="text-[10px] text-orange-700/60 dark:text-orange-500/60 mt-1 italic">
                                                {activeRegister?.status !== 'OPEN'
                                                    ? 'No hay caja abierta (Solo Caja Fuerte disponible)'
                                                    : (formData.paidFromCash ? 'Se descontará del arqueo actual' : 'Se vinculará a una caja anterior')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-1 flex-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-orange-600/60">Código de Caja</label>
                                        <input
                                            type="text"
                                            placeholder="EJ: AB123"
                                            disabled={formData.paidFromCash}
                                            className={`w-full px-3 py-1.5 rounded-lg border dark:bg-slate-800 outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono uppercase ${formData.paidFromCash ? 'bg-slate-100 dark:bg-slate-900 border-slate-200' : 'bg-white border-orange-200'}`}
                                            value={formData.paidFromCash ? (activeRegister?.shortId || '') : formData.cashRegisterShortId}
                                            onChange={e => setFormData({ ...formData, cashRegisterShortId: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary h-12 flex-1 font-bold">CANCELAR</button>
                                <button type="submit" disabled={isSaving} className="btn-primary h-12 flex-1 font-bold">
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
