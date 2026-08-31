'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { SITE_CONFIG } from '@/config';
import {
    LayoutGrid, Package, Tag, ShoppingCart, ClipboardList,
    Wallet, CreditCard, Users, BarChart3, Zap, LogOut, Archive, Truck, LucideIcon,
    Calendar, ShieldCheck, Palette, UserCircle
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
                : 'text-text-muted hover:bg-surface-alt hover:text-foreground'
                }`}
        >
            <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? 'text-white' : 'text-text-faint group-hover:text-text-muted'}`} />
            <span className={`text-sm ${active ? 'font-bold' : 'font-medium'}`}>{children}</span>
        </Link>
    );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="pt-5 pb-1.5 px-4">
        <p className="text-[9px] font-black text-text-faint uppercase tracking-[0.18em]">{children}</p>
    </div>
);

// Catálogo de ventanas del sidebar (debe coincidir con src/lib/windows.ts)
interface NavDef {
    href: string;
    label: string;
    Icon: LucideIcon;
    section: 'Inicio' | 'Operaciones' | 'Catálogo' | 'Administración' | 'Sistema';
}

const NAV: NavDef[] = [
    { href: '/', label: 'Dashboard', Icon: LayoutGrid, section: 'Inicio' },

    { href: '/ventas/nueva', label: 'Nueva Venta', Icon: ShoppingCart, section: 'Operaciones' },
    { href: '/caja', label: 'Caja Diaria', Icon: Wallet, section: 'Operaciones' },
    { href: '/pago-proveedores', label: 'Pago Proveedores', Icon: CreditCard, section: 'Operaciones' },

    { href: '/productos', label: 'Productos', Icon: Package, section: 'Catálogo' },
    { href: '/categorias', label: 'Categorías', Icon: Tag, section: 'Catálogo' },
    { href: '/proveedores', label: 'Proveedores', Icon: Truck, section: 'Catálogo' },

    { href: '/metricas', label: 'Métricas', Icon: BarChart3, section: 'Administración' },
    { href: '/caja/semanal', label: 'Cierre Semanal', Icon: Calendar, section: 'Administración' },
    { href: '/ventas', label: 'Historial de Ventas', Icon: ClipboardList, section: 'Administración' },
    { href: '/pago-proveedores/historial', label: 'Historial de Pagos', Icon: Archive, section: 'Administración' },
    { href: '/caja/historial', label: 'Historial de Caja', Icon: Archive, section: 'Administración' },
    { href: '/empleados', label: 'Vendedores', Icon: Users, section: 'Administración' },
    { href: '/configuracion/pagos', label: 'Métodos de Pago', Icon: CreditCard, section: 'Administración' },

    { href: '/sistema/usuarios', label: 'Usuarios', Icon: Users, section: 'Sistema' },
    { href: '/sistema/perfil', label: 'Mi Perfil', Icon: UserCircle, section: 'Sistema' },
    { href: '/sistema/apariencia', label: 'Apariencia', Icon: Palette, section: 'Sistema' },
    { href: '/sistema/roles', label: 'Gestor de Roles', Icon: ShieldCheck, section: 'Sistema' },
];

export default function Sidebar({
    brandTitle,
    brandSubtitle,
}: {
    brandTitle?: string;
    brandSubtitle?: string;
}) {
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

    // Ventanas permitidas para este usuario (ADMIN recibe todas desde /api/auth/me)
    const allowed = new Set<string>(user?.windows ?? []);
    const isAdmin = user?.role === 'ADMIN';

    // Filtra el catálogo según permisos. ADMIN siempre ve todo.
    const visible = NAV.filter((item) => isAdmin || allowed.has(item.href));

    // Agrupa por sección preservando el orden de aparición
    const sectionsOrder: NavDef['section'][] = ['Inicio', 'Operaciones', 'Catálogo', 'Administración', 'Sistema'];
    const sections = sectionsOrder
        .map((sec) => ({ section: sec, items: visible.filter((i) => i.section === sec) }))
        .filter((g) => g.items.length > 0);

    return (
        <aside className="w-64 border-r border-border bg-surface hidden md:flex flex-col h-screen sticky top-0 z-50">
            {/* Logo */}
            <div className="p-6 border-b border-border-subtle">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black tracking-tight text-foreground leading-none">{brandTitle || SITE_CONFIG.sidebar.title}</h2>
                        <p className="text-[9px] font-bold text-primary/70 uppercase tracking-[0.15em] mt-0.5">{brandSubtitle || SITE_CONFIG.sidebar.subtitle}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar py-2">
                {sections.map((group) => (
                    <div key={group.section}>
                        <SectionLabel>{group.section}</SectionLabel>
                        {group.items.map((item) => (
                            <NavItem
                                key={item.href}
                                href={item.href}
                                Icon={item.Icon}
                                pathname={pathname}
                            >
                                {item.label}
                            </NavItem>
                        ))}
                    </div>
                ))}
            </nav>

            {/* User Panel */}
            <div className="p-4 border-t border-border">
                <div className="bg-surface-alt rounded-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold truncate text-foreground">{user?.name || 'Usuario'}</p>
                        <p className="text-[10px] text-text-muted font-medium truncate">{user?.role || 'Vendedor'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-text-faint hover:text-danger transition-colors p-1.5 hover:bg-danger/10 rounded-lg"
                        title="Cerrar Sesión"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
