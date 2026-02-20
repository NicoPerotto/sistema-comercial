'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

const Icon = ({ children, className = "w-5 h-5" }: { children: React.ReactNode, className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        {children}
    </svg>
);

const NavItem = ({ children, icon, href }: { children: React.ReactNode, icon: React.ReactNode, href: string }) => {
    const pathname = usePathname();
    const active = pathname === href;

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${active
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800'
                }`}
        >
            <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {icon}
            </Icon>
            <span className={`text-sm font-medium ${active ? 'font-bold' : ''}`}>{children}</span>
        </Link>
    );
};

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else if (pathname !== '/login') {
            router.push('/login');
        }
    }, [pathname, router]);

    const handleLogout = async () => {
        if (!user) return;
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            localStorage.removeItem('user');
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (pathname === '/ventas/nueva' || pathname === '/login') return null;

    return (
        <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hidden md:flex flex-col h-screen sticky top-0 z-50">
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <Icon className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></Icon>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">Comercial</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Management System</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-3 space-y-1 mt-4">
                <NavItem href="/" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />}>
                    Dashboard
                </NavItem>
                <NavItem href="/productos" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />}>
                    Productos
                </NavItem>
                <NavItem href="/categorias" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />}>
                    Categorías
                </NavItem>
                <NavItem href="/ventas/nueva" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />}>
                    Nueva Venta
                </NavItem>
                <NavItem href="/ventas" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}>
                    Control de Ventas
                </NavItem>
                <NavItem href="/caja" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />}>
                    Caja Diaria
                </NavItem>

                <div className="pt-6 pb-2 px-6">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Configuración</p>
                </div>

                <NavItem href="/configuracion/pagos" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />}>
                    Pagos / Auditoría
                </NavItem>
                <NavItem href="/empleados" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}>
                    Empleados
                </NavItem>
            </nav>

            <div className="p-4 mt-auto">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs">
                        {user?.name?.[0] || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold truncate text-slate-900 dark:text-white">{user?.name || 'Usuario'}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{user?.role || 'Vendedor'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg group/logout"
                        title="Cerrar Sesión"
                    >
                        <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></Icon>
                    </button>
                </div>
            </div>
        </aside>
    );
}
