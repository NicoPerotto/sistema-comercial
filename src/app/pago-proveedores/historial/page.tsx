'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import {
    FileText,
    Search,
    Wallet,
    CreditCard,
    Banknote,
    Truck,
    Calendar,
    ArrowLeft,
    Filter,
    Download
} from 'lucide-react';
import Link from 'next/link';

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

export default function SupplierPaymentsHistoryPage() {
    const { showToast } = useToast();
    const [payments, setPayments] = useState<SupplierPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeRegister, setActiveRegister] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [paymentsRes, activeRegRes] = await Promise.all([
                fetch('/api/supplier-payments'),
                fetch('/api/cash-register')
            ]);

            const [paymentsData, activeRegData] = await Promise.all([
                paymentsRes.json(),
                activeRegRes.json()
            ]);

            if (Array.isArray(paymentsData)) setPayments(paymentsData);
            if (activeRegData && !activeRegData.error) setActiveRegister(activeRegData);
        } catch (error) {
            showToast('Error al cargar historial', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredPayments = payments.filter(p =>
        p.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.shortId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="page-container">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/pago-proveedores" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <ArrowLeft className="w-4 h-4 text-slate-500" />
                        </Link>
                        <h1 className="text-title text-2xl font-bold">Historial de Pagos</h1>
                    </div>
                    <p className="text-subtitle">Registro histórico de egresos a proveedores</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por proveedor o código..."
                            className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary w-64 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-secondary">
                        <Download className="w-4 h-4" />
                        EXPORTAR
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card-premium">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Histórico</p>
                    <h3 className="text-2xl font-black">${payments.reduce((acc, p) => acc + Number(p.amount), 0).toLocaleString()}</h3>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                        <FileText className="w-3 h-3" />
                        {payments.length} comprobantes registrados
                    </div>
                </div>
                <div className="card-premium border-l-4 border-l-primary">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pagado este mes</p>
                    <h3 className="text-2xl font-black text-primary">
                        ${payments
                            .filter(p => new Date(p.createdAt).getMonth() === new Date().getMonth())
                            .reduce((acc, p) => acc + Number(p.amount), 0)
                            .toLocaleString()}
                    </h3>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                        <Calendar className="w-3 h-3" />
                        Mes actual
                    </div>
                </div>
                <div className="card-premium border-l-4 border-l-orange-500">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Salida de Caja Hoy</p>
                    <h3 className="text-2xl font-black text-orange-500">
                        ${payments
                            .filter(p => p.paidFromCash && new Date(p.createdAt).toLocaleDateString() === new Date().toLocaleDateString())
                            .reduce((acc, p) => acc + Number(p.amount), 0)
                            .toLocaleString()}
                    </h3>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                        <Wallet className="w-3 h-3" />
                        Afecta el arqueo del día
                    </div>
                </div>
            </div>

            <div className="card-premium p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="table-header pl-6">Código</th>
                                <th className="table-header">Fecha</th>
                                <th className="table-header">Proveedor</th>
                                <th className="table-header">Método</th>
                                <th className="table-header">Origen</th>
                                <th className="table-header text-right pr-6">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                Array(10).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredPayments.map(p => (
                                <tr key={p.id} className="table-row">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                            {p.shortId}
                                        </span>
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
                                    <td className="px-6 py-4">
                                        {p.paidFromCash ? (
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border flex items-center gap-1 w-fit ${p.cashRegister?.shortId === activeRegister?.shortId ? 'text-orange-600 bg-orange-50 border-orange-100' : 'text-slate-500 bg-slate-50 border-slate-100'}`}>
                                                <Wallet className="w-2.5 h-2.5" />
                                                {p.cashRegister?.shortId === activeRegister?.shortId ? 'CAJA ACTUAL' : `CAJA ${p.cashRegister?.shortId}`}
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded uppercase">Externo</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right pr-6 font-black text-slate-900 dark:text-white">
                                        ${Number(p.amount).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
