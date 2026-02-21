'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus, TrendingUp, ShoppingBag,
    BarChart3, DollarSign, ArrowUpRight, ArrowDownRight,
    Search, Calendar, Filter
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function MetricasPage() {
    const [period, setPeriod] = useState('today');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dashboard/stats?period=${period}`);
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [period]);

    if (loading && !data) {
        return (
            <div className="p-10 flex flex-col gap-6 animate-pulse">
                <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl w-1/3"></div>
                <div className="grid grid-cols-4 gap-6">
                    {Array(4).fill(0).map((_, i) => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>)}
                </div>
                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 h-80 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                    <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <main className="page-container">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-title text-2xl font-bold">Métricas y Rendimiento</h1>
                    <p className="text-subtitle">Análisis detallado de ventas, categorías y rentabilidad</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
                        {[
                            { id: 'today', label: 'Hoy' },
                            { id: 'last7days', label: '7 Días' },
                            { id: 'month', label: 'Mes' },
                            { id: 'year', label: 'Año' }
                        ].map(p => (
                            <button
                                key={p.id}
                                onClick={() => setPeriod(p.id)}
                                className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${period === p.id ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Ingresos Totales"
                    value={`$${(data?.summary?.totalRevenue || 0).toLocaleString()}`}
                    Icon={TrendingUp}
                    trend="+12%"
                />
                <StatCard
                    title="Transacciones"
                    value={data?.summary?.transactionCount || 0}
                    Icon={ShoppingBag}
                    trend="+5%"
                />
                <StatCard
                    title="Ticket Promedio"
                    value={`$${(data?.summary?.avgTicket || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    Icon={BarChart3}
                />
                <StatCard
                    title="Ganancia Est."
                    value={`$${(data?.summary?.estimatedProfit || 0).toLocaleString()}`}
                    Icon={DollarSign}
                    warning={data?.summary?.estimatedProfit < 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Sales Chart */}
                <div className="lg:col-span-2 card-premium flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">Evolución de Ventas</h3>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{period === 'today' ? 'Ventas por Hora' : 'Ventas Diarias'}</div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.salesTimeline || []}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.5} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: '#fff', fontSize: '12px' }}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']}
                                />
                                <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Categories Distribution */}
                <div className="card-premium flex flex-col gap-6">
                    <h3 className="font-bold text-lg">Por Categoría</h3>
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.categoryDistribution || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(data?.categoryDistribution || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total']}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
                {/* Top Products */}
                <div className="card-premium flex flex-col gap-6">
                    <h3 className="font-bold text-lg">Top 5 Productos</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.topProducts || []} layout="vertical" margin={{ left: 20, right: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontStyle: 'bold', fill: '#64748b' }}
                                    width={120}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                                />
                                <Bar dataKey="quantity" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20}>
                                    {(data?.topProducts || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="card-premium flex flex-col gap-6">
                    <h3 className="font-bold text-lg">Métodos de Pago</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.paymentMethods || []}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={70}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {(data?.paymentMethods || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </main>
    );
}

function StatCard({ title, value, Icon, trend, warning = false }: any) {
    return (
        <div className="card-premium flex flex-col gap-4 group">
            <div className="flex justify-between items-start">
                <div className={`p-3 rounded-lg transition-colors ${warning ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <span className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">{title}</p>
                <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-white tracking-tight">{value}</p>
            </div>
        </div>
    );
}
