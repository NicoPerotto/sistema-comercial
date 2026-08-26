'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    windows?: string[];
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Al montar, validamos la sesión firmada contra el backend (/api/auth/me).
    // La cookie httpOnly viaja automáticamente en el fetch; no usamos localStorage.
    useEffect(() => {
        let cancelled = false;

        async function loadSession() {
            try {
                const res = await fetch('/api/auth/me', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled) setUser(data.user ?? null);
                } else if (!cancelled) {
                    setUser(null);
                }
            } catch {
                if (!cancelled) setUser(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadSession();
        return () => {
            cancelled = true;
        };
    }, []);

    // Redirección por ruta (después de cargar la sesión)
    useEffect(() => {
        if (loading) return;
        if (!user && pathname !== '/login') {
            router.push('/login');
        } else if (user && pathname === '/login') {
            router.push('/');
        }
    }, [user, loading, pathname, router]);

    const login = (userData: User) => {
        // El backend ya seteó la cookie firmada en el POST /login.
        setUser(userData);
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
        } catch {
            // ignore network errors on logout
        }
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
