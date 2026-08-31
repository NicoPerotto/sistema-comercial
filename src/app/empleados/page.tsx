'use client';

import React, { useState, useEffect } from 'react';

const Icon = ({ children, className = "w-5 h-5" }: { children: React.ReactNode, className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        {children}
    </svg>
);

interface Employee {
    id: string;
    name: string;
    role: string;
    showInEmployees?: boolean;
    stats: {
        totalRevenue: number;
        completedCount: number;
        cancelledCount: number;
        salesWithRemovals: number;
        lastShift: {
            startTime: string;
            endTime: string | null;
        } | null;
    };
}

export default function EmployeeControlPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/employees');
            const data = await res.json();
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex-1 flex flex-col p-6 lg:p-10 space-y-8 overflow-hidden text-foreground relative">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-primary">Vendedores</h1>
                    <p className="text-foreground/60 font-medium">Monitoreo de turnos, recaudación y desempeño</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="glass p-6 rounded-3xl animate-pulse h-64 bg-primary/5"></div>
                    ))
                ) : employees.filter((e) => e.showInEmployees).map((emp) => (
                    <div key={emp.id} className="relative">
                        <button
                            onClick={() => setSelectedEmployee(emp)}
                            className="w-full glass p-8 rounded-3xl border border-border hover:border-primary/50 text-left transition-all relative overflow-hidden h-full"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary/20">
                                    {emp.name[0]}
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest">{emp.role}</p>
                                    <div className="flex items-center gap-1.5 justify-end mt-1">
                                        <span className={`w-2 h-2 rounded-full ${emp.stats.lastShift && !emp.stats.lastShift.endTime ? 'bg-green-500 animate-pulse' : 'bg-zinc-300'}`}></span>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase">
                                            {emp.stats.lastShift && !emp.stats.lastShift.endTime ? 'En línea' : 'Desconectado'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-primary mb-1 uppercase italic tracking-tighter">{emp.name}</h3>
                            <p className="text-sm font-bold text-zinc-400 mb-6">ID: {emp.id.slice(0, 8)}...</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-card/50 p-3 rounded-xl border border-border/50">
                                    <p className="text-[9px] font-black text-zinc-400 uppercase mb-1 tracking-tight">Recaudado</p>
                                    <p className="text-lg font-black text-primary line-clamp-1">${emp.stats.totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="bg-card/50 p-3 rounded-xl border border-border/50">
                                    <p className="text-[9px] font-black text-zinc-400 uppercase mb-1 tracking-tight">Ventas</p>
                                    <p className="text-lg font-black text-primary">{emp.stats.completedCount}</p>
                                </div>
                            </div>

                            {emp.stats.salesWithRemovals > 0 && (
                                <div className="mt-4 flex items-center gap-2 bg-warning-light text-amber-700 px-3 py-2 rounded-xl border border-amber-200 shadow-sm animate-bounce-subtle">
                                    <Icon className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></Icon>
                                    <span className="text-[10px] font-black uppercase tracking-tight">{emp.stats.salesWithRemovals} Ventas con quitas</span>
                                </div>
                            )}
                        </button>
                    </div>
                ))}

                {!loading && employees.filter((e) => e.showInEmployees).length === 0 && (
                    <p className="text-text-muted col-span-full">Ningún vendedor marcado como visible. Activá &quot;Mostrar en Vendedores&quot; en el rol correspondiente (Gestor de Roles).</p>
                )}
            </div>

            {selectedEmployee && (
                <div className="glass border border-border rounded-3xl p-8 bg-card/50 animate-in slide-in-from-bottom-4 duration-300">
                    <header className="flex justify-between items-center mb-8 pb-6 border-b border-border/50">
                        <div>
                            <h2 className="text-2xl font-black text-primary uppercase italic">Métricas de {selectedEmployee.name}</h2>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Resumen detallado de desempeño</p>
                        </div>
                        <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                            <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></Icon>
                        </button>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatBox
                            label="Dinero Acumulado"
                            value={`$${selectedEmployee.stats.totalRevenue.toLocaleString()}`}
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                            color="primary"
                        />
                        <StatBox
                            label="Ventas Concretadas"
                            value={selectedEmployee.stats.completedCount.toString()}
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                            color="green"
                        />
                        <StatBox
                            label="Ventas Canceladas"
                            value={selectedEmployee.stats.cancelledCount.toString()}
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                            color="red"
                        />
                        <StatBox
                            label="Alerta Auditoría"
                            value={selectedEmployee.stats.salesWithRemovals.toString()}
                            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />}
                            color="amber"
                            sublabel="Ventas con productos quitados"
                        />
                    </div>

                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <section className="bg-card/30 p-6 rounded-2xl border border-border/30">
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                                <Icon className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>
                                Última Sesión / Turno
                            </h3>
                            {selectedEmployee.stats.lastShift ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-4 bg-card/50 rounded-xl border border-border/20">
                                        <div>
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Entrada</p>
                                            <p className="font-black text-primary">{new Date(selectedEmployee.stats.lastShift.startTime).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Salida</p>
                                            <p className="font-black text-primary">
                                                {selectedEmployee.stats.lastShift.endTime
                                                    ? new Date(selectedEmployee.stats.lastShift.endTime).toLocaleString()
                                                    : <span className="text-green-600 animate-pulse">SESIÓN ACTIVA</span>
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-zinc-400 font-bold italic text-sm">No hay registros de turnos para este empleado.</p>
                            )}
                        </section>

                        <section className="bg-card/30 p-6 rounded-2xl border border-border/30">
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                                <Icon className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></Icon>
                                Eficiencia de Caja
                            </h3>
                            <div className="flex items-center gap-6">
                                <div className="flex-1 h-3 bg-zinc-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary"
                                        style={{ width: `${(selectedEmployee.stats.completedCount / (selectedEmployee.stats.completedCount + selectedEmployee.stats.cancelledCount || 1)) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="font-black text-primary text-xl">
                                    {Math.round((selectedEmployee.stats.completedCount / (selectedEmployee.stats.completedCount + selectedEmployee.stats.cancelledCount || 1)) * 100)}%
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase mt-2">Porcentaje de ventas concretadas vs canceladas</p>
                        </section>
                    </div>
                </div>
            )}
        </main>
    );
}

function StatBox({ label, value, icon, color, sublabel }: { label: string, value: string, icon: React.ReactNode, color: string, sublabel?: string }) {
    const colors: any = {
        primary: 'bg-primary/10 text-primary border-primary/20',
        green: 'bg-green-100 text-green-700 border-green-200',
        red: 'bg-danger-subtle text-red-700 border-red-200',
        amber: 'bg-warning-light text-amber-700 border-amber-200',
    };

    return (
        <div className={`p-6 rounded-2xl border ${colors[color]} shadow-sm`}>
            <div className="flex justify-between items-start mb-2">
                <Icon className="w-6 h-6">{icon}</Icon>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 text-right">{label}</p>
            </div>
            <p className="text-3xl font-black italic">{value}</p>
            {sublabel && <p className="text-[9px] font-bold uppercase mt-1 opacity-70">{sublabel}</p>}
        </div>
    );
}
