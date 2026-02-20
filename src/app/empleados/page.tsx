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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'SELLER'
    });

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingEmployee ? 'PUT' : 'POST';
            const body = editingEmployee ? { ...formData, id: editingEmployee.id } : formData;

            const res = await fetch('/api/employees', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setIsModalOpen(false);
                setEditingEmployee(null);
                setFormData({ name: '', email: '', password: '', role: 'SELLER' });
                fetchEmployees();
            }
        } catch (error) {
            console.error('Error saving employee:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este empleado?')) return;
        try {
            const res = await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (selectedEmployee?.id === id) setSelectedEmployee(null);
                fetchEmployees();
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
        }
    };

    return (
        <main className="flex-1 flex flex-col p-6 lg:p-10 space-y-8 overflow-hidden text-foreground relative">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-primary">Control de Empleados</h1>
                    <p className="text-foreground/60 font-medium">Monitoreo de turnos, recaudación y desempeño auditado</p>
                </div>
                <button
                    onClick={() => {
                        setEditingEmployee(null);
                        setFormData({ name: '', email: '', password: '', role: 'SELLER' });
                        setIsModalOpen(true);
                    }}
                    className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-black uppercase italic tracking-tighter transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
                >
                    <Icon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </Icon>
                    Nuevo Empleado
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="glass p-6 rounded-3xl animate-pulse h-64 bg-primary/5"></div>
                    ))
                ) : employees.map((emp) => (
                    <div key={emp.id} className="relative group">
                        <button
                            onClick={() => setSelectedEmployee(emp)}
                            className={`w-full glass p-8 rounded-3xl border text-left transition-all relative overflow-hidden h-full ${selectedEmployee?.id === emp.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:border-primary/50'
                                }`}
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
                                <div className="bg-white/50 dark:bg-white/5 p-3 rounded-xl border border-border/50">
                                    <p className="text-[9px] font-black text-zinc-400 uppercase mb-1 tracking-tight">Recaudado</p>
                                    <p className="text-lg font-black text-primary line-clamp-1">${emp.stats.totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="bg-white/50 dark:bg-white/5 p-3 rounded-xl border border-border/50">
                                    <p className="text-[9px] font-black text-zinc-400 uppercase mb-1 tracking-tight">Ventas</p>
                                    <p className="text-lg font-black text-primary">{emp.stats.completedCount}</p>
                                </div>
                            </div>

                            {emp.stats.salesWithRemovals > 0 && (
                                <div className="mt-4 flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-2 rounded-xl border border-amber-200 shadow-sm animate-bounce-subtle">
                                    <Icon className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></Icon>
                                    <span className="text-[10px] font-black uppercase tracking-tight">{emp.stats.salesWithRemovals} Ventas con quitas</span>
                                </div>
                            )}
                        </button>

                        {/* Action Buttons on Hover */}
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingEmployee(emp);
                                    setFormData({
                                        name: emp.name,
                                        email: (emp as any).email || '',
                                        password: '',
                                        role: emp.role
                                    });
                                    setIsModalOpen(true);
                                }}
                                className="p-2 bg-white/80 hover:bg-white rounded-xl shadow-lg border border-border text-primary transition-all"
                            >
                                <Icon className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></Icon>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(emp.id);
                                }}
                                className="p-2 bg-red-50 hover:bg-red-100 rounded-xl shadow-lg border border-red-200 text-red-600 transition-all"
                            >
                                <Icon className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></Icon>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedEmployee && (
                <div className="glass border border-border rounded-3xl p-8 bg-white/50 animate-in slide-in-from-bottom-4 duration-300">
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
                        <section className="bg-white/30 p-6 rounded-2xl border border-border/30">
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                                <Icon className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>
                                Última Sesión / Turno
                            </h3>
                            {selectedEmployee.stats.lastShift ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl border border-border/20">
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

                        <section className="bg-white/30 p-6 rounded-2xl border border-border/30">
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

            {/* Modal for Create/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="glass w-full max-w-lg rounded-3xl p-8 border border-white/20 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-primary-dark"></div>

                        <header className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-primary uppercase italic tracking-tighter">
                                    {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
                                </h2>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                                    {editingEmployee ? 'Modificar credenciales y rol' : 'Registrar nuevo miembro del equipo'}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                                <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></Icon>
                            </button>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/50 border border-border rounded-2xl p-4 font-bold text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Email / Usuario</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-white/50 border border-border rounded-2xl p-4 font-bold text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="juan@sistema.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Contraseña {editingEmployee && '(dejar en blanco para no cambiar)'}</label>
                                <input
                                    type="password"
                                    required={!editingEmployee}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-white/50 border border-border rounded-2xl p-4 font-bold text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Rol del Sistema</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['ADMIN', 'MANAGER', 'SELLER', 'PREVENTISTA'].map((role) => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role })}
                                            className={`p-4 rounded-2xl border font-black text-[10px] uppercase tracking-tighter transition-all ${formData.role === role
                                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                    : 'bg-white/50 text-zinc-400 border-border hover:border-primary/50'
                                                }`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 p-4 rounded-2xl font-black uppercase text-[12px] tracking-widest text-zinc-400 hover:bg-zinc-100 transition-all border border-border"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-primary text-white p-4 rounded-2xl font-black uppercase italic text-[12px] tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    {editingEmployee ? 'Guardar Cambios' : 'Registrar Empleado'}
                                </button>
                            </div>
                        </form>
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
        red: 'bg-red-100 text-red-700 border-red-200',
        amber: 'bg-amber-100 text-amber-700 border-amber-200',
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
