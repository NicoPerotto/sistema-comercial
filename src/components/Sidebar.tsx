'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import {
    LayoutGrid, Package, Tag, ShoppingCart, ClipboardList,
    Wallet, CreditCard, Users, BarChart3, Zap, LogOut, Archive, Truck, LucideIcon
} from 'lucide-react';

interface NavItemProps {
    children: React.ReactNode;
    Icon: LucideIcon;
    href: string;
    pathname: string; // Recibido desde el padre para evitar llamar usePathname() N veces
    exact?: boolean;
}

const NavItem = ({ children, Icon, href, pathname, exact = false }: NavItemProps) => {
    // Routes with their own child nav entries must use exact match only
    const useExact = exact || href === '/caja' || href === '/';
    const active = useExact
        ? pathname === href
        : pathname === href || (href.length > 1 && pathname.startsWith(href + '/'));

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${active
                ? 'bg-primary text-white shadow-sm shadow-primary/25'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
        >
            <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`} />
            <span className={`text-sm ${active ? 'font-bold' : 'font-medium'}`}>{children}</span>
        </Link>
    );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="pt-5 pb-1.5 px-4">
        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.18em]">{children}</p>
    </div>
);

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        if (!user) return;
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: (user as any).id }),
            });
            logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (pathname === '/ventas/nueva' || pathname === '/login') return null;

    const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    return (
        <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden md:flex flex-col h-screen sticky top-0 z-50">
            {/* Logo */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none">Comercial</h2>
                        <p className="text-[9px] font-bold text-primary/70 uppercase tracking-[0.15em] mt-0.5">Management System</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar py-2">

                <SectionLabel>Inicio</SectionLabel>
                <NavItem href="/" Icon={LayoutGrid} pathname={pathname}>Dashboard</NavItem>

                <SectionLabel>Operaciones</SectionLabel>
                <NavItem href="/ventas/nueva" Icon={ShoppingCart} pathname={pathname}>Nueva Venta</NavItem>
                <NavItem href="/caja" Icon={Wallet} pathname={pathname}>Caja Diaria</NavItem>
                <NavItem href="/pago-proveedores" Icon={CreditCard} pathname={pathname}>Pago Proveedores</NavItem>

                <SectionLabel>Catálogo</SectionLabel>
                <NavItem href="/productos" Icon={Package} pathname={pathname}>Productos</NavItem>
                <NavItem href="/categorias" Icon={Tag} pathname={pathname}>Categorías</NavItem>
                <NavItem href="/proveedores" Icon={Truck} pathname={pathname}>Proveedores</NavItem>

                {isAdminOrManager && (
                    <>
                        <SectionLabel>Administración</SectionLabel>
                        <NavItem href="/metricas" Icon={BarChart3} pathname={pathname}>Métricas</NavItem>
                        <NavItem href="/ventas" Icon={ClipboardList} pathname={pathname}>Historial de Ventas</NavItem>
                        <NavItem href="/pago-proveedores/historial" Icon={Archive} pathname={pathname}>Historial de Pagos</NavItem>
                        <NavItem href="/caja/historial" Icon={Archive} pathname={pathname}>Historial de Caja</NavItem>
                        <NavItem href="/empleados" Icon={Users} pathname={pathname}>Empleados</NavItem>
                        <NavItem href="/configuracion/pagos" Icon={CreditCard} pathname={pathname}>Métodos de Pago</NavItem>
                    </>
                )}
            </nav>

            {/* User Panel */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold truncate text-slate-900 dark:text-white">{user?.name || 'Usuario'}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">{user?.role || 'Vendedor'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Cerrar Sesión"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
