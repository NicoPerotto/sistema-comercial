'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/components/AuthProvider';
import { CREATE_CREDIT_CUSTOMERS } from '@/lib/role-permissions';
import { calculateAppliedAmount, calculateReceivedAmount } from '@/lib/credit-payment';
import {
    AlertTriangle,
    CheckCircle2,
    Eye,
    HandCoins,
    Mail,
    Pencil,
    Phone,
    Plus,
    Search,
    Trash2,
    UserRound,
    Users,
    Wallet,
    X,
} from 'lucide-react';

interface Customer {
    id: string;
    name: string;
    dni: string | null;
    phone: string | null;
    address: string | null;
    email: string | null;
    active: boolean;
    creditLimit: number | null;
    totalCharged: number;
    totalPaid: number;
    balance: number;
    available: number | null;
    overLimit: boolean;
    salesCount: number;
    lastPurchaseAt: string | null;
    lastPaymentAt: string | null;
}

interface PaymentMethod {
    id: string;
    name: string;
    percentage: number;
    isArqueable: boolean;
    isCredit: boolean;
    isDefault?: boolean;
}

interface CustomerDetail extends Customer {
    sales: any[];
    payments: any[];
}

const EMPTY_FORM = {
    name: '',
    dni: '',
    phone: '',
    address: '',
    email: '',
    creditLimit: '',
    active: true,
};

const money = (value: any) => {
    const n = Number(value) || 0;
    return `$${n.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
};

const shortDate = (value: string | null | undefined) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
    });
};

const dateTime = (value: string | null | undefined) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
};

export default function CreditCustomersPage() {
    const { showToast } = useToast();
    const { user } = useAuth();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'debtors' | 'overdue' | 'inactive'>('all');

    // Alta / edición
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editing, setEditing] = useState<Customer | null>(null);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [isSaving, setIsSaving] = useState(false);

    // Detalle
    const [detail, setDetail] = useState<CustomerDetail | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    // Cobros
    const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isPaying, setIsPaying] = useState(false);
    const [registerOpen, setRegisterOpen] = useState<boolean | null>(null);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/credit-customers', { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al cargar clientes');
            setCustomers(Array.isArray(data) ? data : []);
        } catch (error: any) {
            showToast(error.message || 'Error al cargar clientes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentMethods = async () => {
        try {
            const res = await fetch('/api/payment-methods', { cache: 'no-store' });
            const data = await res.json();
            // No se puede cobrar una deuda con otro método de cuenta corriente.
            const usable = (Array.isArray(data) ? data : []).filter((m: PaymentMethod) => !m.isCredit);
            setPaymentMethods(usable);
            const preferred =
                usable.find((m: PaymentMethod) => m.isDefault) ??
                usable.find((m: PaymentMethod) => m.isArqueable) ??
                usable[0];
            if (preferred) setPaymentMethodId((current) => current || preferred.id);
        } catch {
            // El cobro mostrará el error al intentar guardar.
        }
    };

    const fetchRegisterStatus = async () => {
        try {
            const res = await fetch('/api/cash-register', { cache: 'no-store' });
            const data = await res.json();
            setRegisterOpen(data.status === 'OPEN');
        } catch {
            setRegisterOpen(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
        fetchPaymentMethods();
    }, []);

    const openCreate = () => {
        setEditing(null);
        setFormData({ ...EMPTY_FORM });
        setIsFormOpen(true);
    };

    const openEdit = (customer: Customer) => {
        setEditing(customer);
        setFormData({
            name: customer.name,
            dni: customer.dni || '',
            phone: customer.phone || '',
            address: customer.address || '',
            email: customer.email || '',
            creditLimit:
                customer.creditLimit === null || customer.creditLimit === undefined
                    ? ''
                    : String(customer.creditLimit),
            active: customer.active,
        });
        setIsFormOpen(true);
    };

    const saveCustomer = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                creditLimit:
                    formData.creditLimit.trim() === ''
                        ? null
                        : Number(formData.creditLimit),
            };
            const body = editing ? { id: editing.id, ...payload } : payload;
            const res = await fetch('/api/credit-customers', {
                method: editing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al guardar cliente');

            showToast(editing ? 'Cliente actualizado' : 'Cliente creado', 'success');
            setIsFormOpen(false);
            setEditing(null);
            await fetchCustomers();
            if (detail?.id === data.id) await openDetail(data.id);
        } catch (error: any) {
            showToast(error.message || 'Error al guardar cliente', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const deleteCustomer = async (customer: Customer) => {
        if (!confirm(`¿Eliminar a "${customer.name}"? Solo se puede si no tiene ventas ni pagos.`)) return;

        try {
            const res = await fetch(`/api/credit-customers?id=${customer.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al eliminar cliente');
            showToast('Cliente eliminado', 'success');
            await fetchCustomers();
        } catch (error: any) {
            showToast(error.message || 'Error al eliminar cliente', 'error');
        }
    };

    const openDetail = async (customerId: string) => {
        setIsDetailOpen(true);
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/credit-customers/${customerId}`, { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al cargar el detalle');
            setDetail(data);
        } catch (error: any) {
            showToast(error.message || 'Error al cargar el detalle', 'error');
            setIsDetailOpen(false);
        } finally {
            setDetailLoading(false);
        }
    };

    const openPayment = (customer: Customer) => {
        setPaymentCustomer(customer);
        setPaymentAmount(Number(customer.balance) > 0 ? Number(customer.balance).toFixed(2) : '');
        setPaymentMethodId('');
        setPaymentMethods([]);
        setRegisterOpen(null);
        setIsPaymentOpen(true);
        fetchPaymentMethods();
        fetchRegisterStatus();
    };

    const submitPayment = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user) return showToast('Debés iniciar sesión para registrar cobros', 'error');
        if (!paymentCustomer) return;

        const amount = Number(paymentAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            return showToast('Ingresá un importe válido', 'error');
        }
        if (!paymentMethodId) {
            return showToast('Seleccioná un método de pago', 'error');
        }

        setIsPaying(true);
        try {
            const res = await fetch('/api/credit-payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: paymentCustomer.id,
                    amount,
                    paymentMethodId,
                    userId: user.id,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.error || 'Error al registrar el cobro');

            showToast(`Cobro registrado. Saldo restante: ${money(data.newBalance)}`, 'success');
            setIsPaymentOpen(false);
            setPaymentCustomer(null);
            await fetchCustomers();
            if (detail?.id) await openDetail(detail.id);
        } catch (error: any) {
            showToast(error.message || 'Error al registrar el cobro', 'error');
        } finally {
            setIsPaying(false);
        }
    };

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        const result = customers.filter((customer) => {
            const matchesSearch =
                !term ||
                customer.name.toLowerCase().includes(term) ||
                (customer.dni || '').toLowerCase().includes(term) ||
                (customer.phone || '').toLowerCase().includes(term) ||
                (customer.email || '').toLowerCase().includes(term);

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'debtors' && Number(customer.balance) > 0.009) ||
                (statusFilter === 'overdue' && customer.overLimit) ||
                (statusFilter === 'inactive' && !customer.active);

            return matchesSearch && matchesStatus;
        });

        // Mayor deuda primero.
        return result.sort((a, b) => Number(b.balance) - Number(a.balance));
    }, [customers, search, statusFilter]);

    const stats = useMemo(() => {
        const totalDebt = customers.reduce(
            (sum, customer) => sum + Math.max(0, Number(customer.balance)),
            0
        );
        return {
            totalDebt,
            debtors: customers.filter((customer) => Number(customer.balance) > 0.009).length,
            overLimit: customers.filter((customer) => customer.overLimit).length,
            totalPaid: customers.reduce((sum, customer) => sum + Number(customer.totalPaid), 0),
            totalCharged: customers.reduce((sum, customer) => sum + Number(customer.totalCharged), 0),
        };
    }, [customers]);

    const canCreateCustomers =
        user?.role === 'ADMIN' || !!user?.actions?.includes(CREATE_CREDIT_CUSTOMERS);
    const selectedPaymentMethod = paymentMethods.find((method) => method.id === paymentMethodId);
    const paymentGrossAmount = Number(paymentAmount) || 0;
    const paymentPercentage = Number(selectedPaymentMethod?.percentage) || 0;
    const calculatedAppliedAmount = calculateAppliedAmount(paymentGrossAmount, paymentPercentage);
    const paymentAppliedAmount = calculatedAppliedAmount ?? 0;
    const paymentAdjustment = Math.round((paymentGrossAmount - paymentAppliedAmount + Number.EPSILON) * 100) / 100;

    return (
        <main className="page-container">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-title text-2xl font-bold">A Cuenta</h1>
                    <p className="text-subtitle">
                        Personas que compran y pagan después: su deuda actual, su límite y sus cobros.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                            <Search className="w-5 h-5" />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, DNI, teléfono..."
                            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                    {canCreateCustomers && (
                        <button onClick={openCreate} className="btn-primary">
                            <Plus className="w-5 h-5" />
                            NUEVO CLIENTE
                        </button>
                    )}
                </div>
            </header>

            {/* Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card-premium p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-danger-subtle text-danger-dark flex items-center justify-center">
                            <HandCoins className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-text-faint uppercase tracking-widest">Deuda total</p>
                            <p className="text-2xl font-black text-danger-dark">{money(stats.totalDebt)}</p>
                        </div>
                    </div>
                    <p className="text-[11px] text-text-muted mt-3">
                        {stats.debtors} cliente{stats.debtors !== 1 ? 's' : ''} con saldo pendiente
                        {stats.overLimit > 0 && (
                            <span className="text-danger-dark font-bold">
                                {' '}· {stats.overLimit} excedido{stats.overLimit !== 1 ? 's' : ''}
                            </span>
                        )}
                    </p>
                </div>

                <div className="card-premium p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-text-faint uppercase tracking-widest">Clientes</p>
                            <p className="text-2xl font-black">{customers.length}</p>
                        </div>
                    </div>
                    <p className="text-[11px] text-text-muted mt-3">
                        {customers.filter((customer) => customer.active).length} activos
                    </p>
                </div>

                <div className="card-premium p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-success-subtle text-success-dark flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-text-faint uppercase tracking-widest">Aplicado a deuda</p>
                            <p className="text-2xl font-black text-success-dark">{money(stats.totalPaid)}</p>
                        </div>
                    </div>
                    <p className="text-[11px] text-text-muted mt-3">
                        Sobre {money(stats.totalCharged)} vendidos a cuenta
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-surface rounded-lg p-1 border border-border gap-0.5">
                    {([
                        ['all', 'Todos'],
                        ['debtors', 'Con deuda'],
                        ['overdue', 'Excedidos'],
                        ['inactive', 'Inactivos'],
                    ] as const).map(([value, label]) => (
                        <button
                            key={value}
                            onClick={() => setStatusFilter(value)}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                                statusFilter === value
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-text-faint hover:text-foreground'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <span className="text-xs text-text-muted">
                    {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Tabla */}
            <div className="card-premium p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border bg-surface-alt">
                                <th className="table-header pl-6">Cliente</th>
                                <th className="table-header">Contacto</th>
                                <th className="table-header text-right">Deuda actual</th>
                                <th className="table-header text-right">Límite</th>
                                <th className="table-header text-right">Disponible</th>
                                <th className="table-header text-center">Estado</th>
                                <th className="table-header text-center">Último mov.</th>
                                <th className="table-header text-right pr-6">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                Array(4).fill(0).map((_, index) => (
                                    <tr key={index} className="animate-pulse">
                                        <td colSpan={8} className="px-6 py-5">
                                            <div className="h-7 bg-surface rounded w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center text-text-muted">
                                        <div className="flex flex-col items-center gap-3">
                                            <UserRound className="w-10 h-10 opacity-20" />
                                            <p className="font-medium">
                                                {search || statusFilter !== 'all'
                                                    ? 'No se encontraron clientes con esos filtros'
                                                    : 'Todavía no hay clientes a cuenta'}
                                            </p>
                                            {canCreateCustomers && !search && statusFilter === 'all' && (
                                                <button onClick={openCreate} className="btn-secondary text-xs">
                                                    <Plus className="w-4 h-4" />
                                                    Crear el primero
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((customer) => {
                                    const balance = Number(customer.balance);
                                    const limit = customer.creditLimit;
                                    const available = customer.available;
                                    const lastMovement =
                                        customer.lastPaymentAt && (!customer.lastPurchaseAt || customer.lastPaymentAt > customer.lastPurchaseAt)
                                            ? customer.lastPaymentAt
                                            : customer.lastPurchaseAt;
                                    return (
                                        <tr key={customer.id} className="table-row">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black flex-shrink-0">
                                                        {customer.name[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm truncate">{customer.name}</p>
                                                        <p className="text-[10px] text-text-faint">
                                                            {customer.dni ? `DNI ${customer.dni} · ` : ''}
                                                            {customer.salesCount} venta{customer.salesCount !== 1 ? 's' : ''} a cuenta
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1 text-xs text-text-muted">
                                                    {customer.phone && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Phone className="w-3 h-3" />
                                                            {customer.phone}
                                                        </div>
                                                    )}
                                                    {customer.email && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Mail className="w-3 h-3" />
                                                            {customer.email}
                                                        </div>
                                                    )}
                                                    {!customer.phone && !customer.email && (
                                                        <span className="text-text-faint italic">Sin datos</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {balance > 0.009 ? (
                                                    <div>
                                                        <p className="font-black text-danger-dark">{money(balance)}</p>
                                                        <p className="text-[10px] text-text-faint">pendiente</p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="font-bold text-success-dark">Sin deuda</p>
                                                        <p className="text-[10px] text-text-faint">al día</p>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {limit === null ? (
                                                    <span className="text-xs text-text-faint italic">Sin límite</span>
                                                ) : (
                                                    <span className="font-bold text-sm">{money(limit)}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {available === null ? (
                                                    <span className="text-text-faint italic">—</span>
                                                ) : (
                                                    <span
                                                        className={`font-bold text-sm ${
                                                            available < -0.01 ? 'text-danger-dark' : 'text-success-dark'
                                                        }`}
                                                    >
                                                        {money(available)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {!customer.active ? (
                                                    <span className="badge badge-danger">Inactivo</span>
                                                ) : customer.overLimit ? (
                                                    <span className="badge badge-danger">Excedido</span>
                                                ) : limit === null ? (
                                                    <span className="badge bg-surface-alt text-text-muted">Sin límite</span>
                                                ) : (
                                                    <span className="badge badge-success">Al día</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center text-xs text-text-muted">
                                                {shortDate(lastMovement)}
                                            </td>
                                            <td className="px-6 py-4 pr-6">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => openDetail(customer.id)}
                                                        className="p-2 text-text-muted hover:text-primary transition-colors"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openPayment(customer)}
                                                        disabled={balance <= 0.009}
                                                        className="p-2 text-text-muted hover:text-success-dark transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                                                        title="Registrar cobro"
                                                    >
                                                        <HandCoins className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEdit(customer)}
                                                        className="p-2 text-text-muted hover:text-primary transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteCustomer(customer)}
                                                        className="p-2 text-text-muted hover:text-danger transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal alta / edición */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <header className="p-6 border-b border-border bg-surface-alt flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold">{editing ? 'Editar cliente' : 'Nuevo cliente'}</h2>
                                <p className="text-xs text-text-muted">Solo el nombre es obligatorio.</p>
                            </div>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="p-2 text-text-muted hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </header>

                        <form onSubmit={saveCustomer} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Nombre *</label>
                                <input
                                    required
                                    autoFocus
                                    type="text"
                                    placeholder="Ej: Juan Pérez"
                                    className="w-full px-4 py-2 rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.name}
                                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">DNI</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: 30123456"
                                        className="w-full px-4 py-2 rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary"
                                        value={formData.dni}
                                        onChange={(event) => setFormData({ ...formData, dni: event.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Teléfono</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: +54 9 11 1234-5678"
                                        className="w-full px-4 py-2 rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary"
                                        value={formData.phone}
                                        onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Dirección</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Av. Siempre Viva 742"
                                    className="w-full px-4 py-2 rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.address}
                                    onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Email</label>
                                <input
                                    type="email"
                                    placeholder="Ej: juan@correo.com"
                                    className="w-full px-4 py-2 rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.email}
                                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Límite de crédito</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Sin límite"
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary"
                                        value={formData.creditLimit}
                                        onChange={(event) =>
                                            setFormData({ ...formData, creditLimit: event.target.value })
                                        }
                                    />
                                </div>
                                <p className="text-[11px] text-text-muted">
                                    Controla la deuda acumulada. Dejalo vacío para sin límite.
                                </p>
                            </div>

                            {editing && (
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                                    className="w-full flex items-center gap-3 p-4 bg-surface-alt rounded-lg text-left"
                                >
                                    <div
                                        className={`w-5 h-5 rounded border flex items-center justify-center ${
                                            formData.active
                                                ? 'bg-primary border-primary text-white'
                                                : 'border-border bg-card'
                                        }`}
                                    >
                                        {formData.active && <CheckCircle2 className="w-3 h-3" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Cliente activo</p>
                                        <p className="text-xs text-text-muted">
                                            Los clientes inactivos no pueden recibir nuevas ventas a cuenta.
                                        </p>
                                    </div>
                                </button>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="btn-secondary flex-1"
                                >
                                    CANCELAR
                                </button>
                                <button type="submit" disabled={isSaving} className="btn-primary flex-1">
                                    {isSaving ? 'GUARDANDO...' : 'GUARDAR'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal detalle */}
            {isDetailOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
                        <header className="p-6 border-b border-border bg-surface-alt flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold">
                                    {detailLoading ? 'Cargando...' : detail?.name || 'Cliente'}
                                </h2>
                                <p className="text-xs text-text-muted">Historial de ventas a cuenta y cobros</p>
                            </div>
                            <button
                                onClick={() => setIsDetailOpen(false)}
                                className="p-2 text-text-muted hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </header>

                        {detailLoading || !detail ? (
                            <div className="p-10 text-center text-text-muted animate-pulse">
                                Cargando detalle del cliente...
                            </div>
                        ) : (
                            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl bg-danger-subtle/50 border border-danger/10">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-danger-dark/70">
                                            Deuda actual
                                        </p>
                                        <p className="text-2xl font-black text-danger-dark">{money(detail.balance)}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-surface-alt border border-border">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-faint">
                                            Total comprado
                                        </p>
                                        <p className="text-2xl font-black">{money(detail.totalCharged)}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-success-subtle/50 border border-success/10">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-success-dark/70">
                                            Total aplicado
                                        </p>
                                        <p className="text-2xl font-black text-success-dark">{money(detail.totalPaid)}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-text-muted">
                                    <span>
                                        Límite:{' '}
                                        <strong className="text-foreground">
                                            {detail.creditLimit === null ? 'Sin límite' : money(detail.creditLimit)}
                                        </strong>
                                    </span>
                                    {detail.available !== null && (
                                        <span>
                                            Disponible:{' '}
                                            <strong className={detail.available < -0.01 ? 'text-danger-dark' : 'text-success-dark'}>
                                                {money(detail.available)}
                                            </strong>
                                        </span>
                                    )}
                                    {detail.overLimit && <span className="badge badge-danger">Excedido</span>}
                                    {detail.dni && <span>DNI: <strong className="text-foreground">{detail.dni}</strong></span>}
                                    {detail.phone && <span>Tel: <strong className="text-foreground">{detail.phone}</strong></span>}
                                    {detail.email && <span>Email: <strong className="text-foreground">{detail.email}</strong></span>}
                                    {detail.address && <span>Dirección: <strong className="text-foreground">{detail.address}</strong></span>}
                                    <span className={`badge ${detail.active ? 'badge-success' : 'badge-danger'}`}>
                                        {detail.active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <section>
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-faint mb-3 flex items-center gap-2">
                                            <Wallet className="w-4 h-4" />
                                            Ventas a cuenta ({detail.sales.length})
                                        </h3>
                                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                            {detail.sales.length === 0 ? (
                                                <p className="text-xs text-text-muted italic p-3 bg-surface-alt rounded-lg">
                                                    Sin ventas a cuenta.
                                                </p>
                                            ) : (
                                                detail.sales.map((sale) => (
                                                    <div
                                                        key={sale.id}
                                                        className="p-3 bg-surface-alt rounded-lg border border-border-subtle flex justify-between items-center gap-3"
                                                    >
                                                        <div>
                                                            <p className="text-xs font-bold flex items-center gap-2">
                                                                #{sale.id.slice(-6).toUpperCase()}
                                                                {sale.creditLimitExceeded && (
                                                                    <span className="badge badge-warning">Excedió límite</span>
                                                                )}
                                                            </p>
                                                            <p className="text-[10px] text-text-faint">
                                                                {dateTime(sale.createdAt)} • {sale.items?.length || 0} artículo(s)
                                                            </p>
                                                        </div>
                                                        <p className="text-sm font-black text-danger-dark">
                                                            {money(sale.total)}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-faint mb-3 flex items-center gap-2">
                                            <HandCoins className="w-4 h-4" />
                                            Cobros ({detail.payments.length})
                                        </h3>
                                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                            {detail.payments.length === 0 ? (
                                                <p className="text-xs text-text-muted italic p-3 bg-surface-alt rounded-lg">
                                                    Sin cobros registrados.
                                                </p>
                                            ) : (
                                                detail.payments.map((payment) => (
                                                    <div
                                                        key={payment.id}
                                                        className="p-3 bg-surface-alt rounded-lg border border-border-subtle flex justify-between items-center gap-3"
                                                    >
                                                        <div>
                                                            <p className="text-xs font-bold">
                                                                {payment.paymentMethod?.name || 'Cobro'}
                                                            </p>
                                                            <p className="text-[10px] text-text-faint">
                                                                {dateTime(payment.createdAt)}
                                                                {payment.cashRegister?.shortId
                                                                    ? ` • Caja #${payment.cashRegister.shortId}`
                                                                    : ''}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-black text-success-dark">
                                                                +{money(payment.appliedAmount ?? payment.amount)}
                                                            </p>
                                                            {payment.appliedAmount != null &&
                                                                Number(payment.appliedAmount) !== Number(payment.amount) && (
                                                                    <p className="text-[10px] text-text-faint">
                                                                        Recibido: {money(payment.amount)}
                                                                    </p>
                                                                )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        )}

                        <footer className="p-4 border-t border-border bg-surface-alt flex justify-end gap-3">
                            <button onClick={() => setIsDetailOpen(false)} className="btn-secondary">
                                CERRAR
                            </button>
                            <button
                                onClick={() => detail && openPayment(detail)}
                                disabled={!detail || Number(detail.balance) <= 0.009}
                                className="btn-primary disabled:opacity-40"
                            >
                                <HandCoins className="w-4 h-4" />
                                REGISTRAR COBRO
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* Modal cobro */}
            {isPaymentOpen && paymentCustomer && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <header className="p-6 border-b border-border bg-surface-alt flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold">Registrar cobro</h2>
                                <p className="text-xs text-text-muted">{paymentCustomer.name}</p>
                            </div>
                            <button
                                onClick={() => setIsPaymentOpen(false)}
                                className="p-2 text-text-muted hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </header>

                        <form onSubmit={submitPayment} className="p-6 space-y-5">
                            <div className="p-4 rounded-xl bg-danger-subtle/50 border border-danger/10 flex justify-between items-center">
                                <span className="text-xs font-bold uppercase tracking-widest text-danger-dark/70">
                                    Deuda actual
                                </span>
                                <span className="text-xl font-black text-danger-dark">
                                    {money(paymentCustomer.balance)}
                                </span>
                            </div>

                            {registerOpen === false && (
                                <div className="p-3 rounded-lg bg-warning-light/50 border border-warning/30 text-xs text-amber-800 flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>
                                        No hay una caja abierta. Los cobros deben registrarse dentro de un turno de caja.{' '}
                                        <Link href="/caja" className="font-bold underline">
                                            Abrir caja
                                        </Link>
                                    </span>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Importe recibido *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-text-muted">
                                        $
                                    </span>
                                    <input
                                        required
                                        autoFocus
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        className="w-full pl-9 pr-4 py-3 rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary text-right text-xl font-bold"
                                        value={paymentAmount}
                                        onChange={(event) => setPaymentAmount(event.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const grossAmount = calculateReceivedAmount(
                                            Number(paymentCustomer.balance),
                                            paymentPercentage
                                        );
                                        if (grossAmount !== null) setPaymentAmount(grossAmount.toFixed(2));
                                    }}
                                    className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
                                >
                                    Pagar toda la deuda
                                </button>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Método de pago *</label>
                                <select
                                    required
                                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-card outline-none focus:ring-2 focus:ring-primary"
                                    value={paymentMethodId}
                                    onChange={(event) => setPaymentMethodId(event.target.value)}
                                >
                                    <option value="">Seleccionar método...</option>
                                    {paymentMethods.map((method) => (
                                        <option key={method.id} value={method.id}>
                                            {method.name}
                                            {Number(method.percentage) !== 0
                                                ? ` (${Number(method.percentage) > 0 ? '+' : ''}${method.percentage}%)`
                                                : ''}
                                        </option>
                                    ))}
                                </select>
                                {selectedPaymentMethod && calculatedAppliedAmount === null ? (
                                    <p className="text-xs text-danger-dark">
                                        El porcentaje de este método no permite calcular un importe válido.
                                    </p>
                                ) : selectedPaymentMethod ? (
                                    <p className="text-xs text-text-muted">
                                        De los {money(paymentGrossAmount)} recibidos, {money(paymentAppliedAmount)} se aplican a la deuda
                                        {paymentAdjustment !== 0
                                            ? ` (ajuste del método: ${paymentAdjustment > 0 ? '+' : ''}${money(paymentAdjustment)}).`
                                            : '.'}
                                    </p>
                                ) : null}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPaymentOpen(false)}
                                    className="btn-secondary flex-1"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPaying || registerOpen === false || calculatedAppliedAmount === null}
                                    className="btn-primary flex-1"
                                >
                                    {isPaying ? 'REGISTRANDO...' : 'CONFIRMAR COBRO'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
