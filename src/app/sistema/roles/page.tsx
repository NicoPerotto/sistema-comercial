'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { APP_WINDOWS } from '@/lib/windows';

interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: { windows: string[] };
}

const Icon = ({ children, className = 'w-5 h-5' }: { children: React.ReactNode; className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>
);

const sectionsOrder = ['Inicio', 'Operaciones', 'Catálogo', 'Administración', 'Sistema'] as const;

export default function RolesManagerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', windows: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: solo ADMIN
  useEffect(() => {
    if (!loading && user?.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [loading, user, router]);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      if (res.ok) setRoles(data);
      else setError(data.error || 'Error al cargar roles');
    } catch {
      setError('Error de red al cargar roles');
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchRoles();
  }, [user]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '', windows: [] });
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditing(role);
    setForm({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
      windows: [...role.permissions.windows],
    });
    setError(null);
    setIsModalOpen(true);
  };

  const toggleWindow = (path: string) => {
    setForm((f) => ({
      ...f,
      windows: f.windows.includes(path)
        ? f.windows.filter((w) => w !== path)
        : [...f.windows, path],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch('/api/roles', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setEditing(null);
        fetchRoles();
      } else {
        setError(data.error || 'Error al guardar');
      }
    } catch {
      setError('Error de red al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (role.isSystem) return;
    if (!confirm(`¿Eliminar el rol "${role.name}"? Los usuarios vuelven a su rol base.`)) return;
    try {
      const res = await fetch(`/api/roles?id=${role.id}`, { method: 'DELETE' });
      if (res.ok) fetchRoles();
      else {
        const data = await res.json();
        setError(data.error || 'Error al eliminar');
      }
    } catch {
      setError('Error de red al eliminar');
    }
  };

  if (loading || (user?.role !== 'ADMIN')) {
    return (
      <main className="flex-1 flex flex-col p-6 lg:p-10 text-foreground">
        <p className="text-text-muted">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col p-6 lg:p-10 space-y-8 overflow-y-auto text-foreground">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-primary">Gestor de Roles</h1>
          <p className="text-foreground/60 font-medium">Definí qué ventanas puede ver cada rol del sistema</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-black uppercase italic tracking-tighter transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
        >
          <Icon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </Icon>
          Nuevo Rol
        </button>
      </header>

      {error && (
        <div className="bg-danger-subtle text-danger border border-danger/20 px-4 py-3 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      {loadingRoles ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="glass p-6 rounded-3xl animate-pulse h-40 bg-primary/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.id} className="glass p-6 rounded-3xl border border-border relative group">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-black text-primary uppercase italic tracking-tighter">{role.name}</h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SLUG: {role.slug}</p>
                </div>
                {role.isSystem && (
                  <span className="text-[9px] font-black uppercase bg-primary-light text-primary-dark px-2 py-1 rounded-full">Sistema</span>
                )}
              </div>
              <p className="text-sm text-text-muted mb-4 min-h-[20px]">{role.description || 'Sin descripción'}</p>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">
                  {role.permissions.windows.length} ventana(s) · {role.userCount} usuario(s)
                </p>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!role.isSystem && (
                    <>
                      <button
                        onClick={() => openEdit(role)}
                        className="p-2 bg-card/80 hover:bg-card rounded-xl shadow-lg border border-border text-primary transition-all"
                        title="Editar"
                      >
                        <Icon className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></Icon>
                      </button>
                      <button
                        onClick={() => handleDelete(role)}
                        className="p-2 bg-red-50 hover:bg-danger-subtle rounded-xl shadow-lg border border-red-200 text-danger transition-all"
                        title="Eliminar"
                      >
                        <Icon className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 1 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></Icon>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {roles.length === 0 && (
            <p className="text-text-muted col-span-full">No hay roles configurados.</p>
          )}
        </div>
      )}

      {/* Modal crear/editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-2xl rounded-3xl p-8 border border-white/20 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-primary-dark" />

            <header className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-black text-primary uppercase italic tracking-tighter">
                  {editing ? 'Editar Rol' : 'Nuevo Rol'}
                </h2>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                  {editing ? 'Modificar permisos de ventanas' : 'Crear un rol y asignar ventanas'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                <Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></Icon>
              </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Nombre</label>
                  <input
                    type="text" required value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-card/50 border border-border rounded-2xl p-3 font-bold text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="Ej: Vendedor"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Slug (identificador)</label>
                  <input
                    type="text" required value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toUpperCase() })}
                    disabled={!!editing?.isSystem}
                    className="w-full bg-card/50 border border-border rounded-2xl p-3 font-bold text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none uppercase disabled:opacity-50"
                    placeholder="Ej: VENDEDOR"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Descripción</label>
                <input
                  type="text" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-card/50 border border-border rounded-2xl p-3 font-bold text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Ej: Personal de ventas en mostrador"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">
                  Ventanas permitidas ({form.windows.length} seleccionadas)
                </label>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2 border border-border rounded-2xl p-4 bg-card/30">
                  {sectionsOrder.map((section) => {
                    const items = APP_WINDOWS.filter((w) => w.section === section);
                    if (items.length === 0) return null;
                    return (
                      <div key={section}>
                        <p className="text-[9px] font-black text-primary/50 uppercase tracking-[0.18em] mb-2">{section}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {items.map((w) => {
                            const checked = form.windows.includes(w.path);
                            const isBaseRole = !!editing && ['ADMIN', 'OWNER', 'MANAGER'].includes(editing.slug);
                            const disabled = w.adminOnly && !isBaseRole;
                            const isChecked = checked || (w.adminOnly && isBaseRole);
                            return (
                              <label
                                key={w.path}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${isChecked ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-card/50 border-border text-text-muted hover:border-primary/40'} ${disabled ? 'opacity-60' : 'cursor-pointer'}`}
                              >
                                <input
                                  type="checkbox"
                                  className="accent-primary w-4 h-4"
                                  checked={isChecked}
                                  disabled={disabled}
                                  onChange={() => !disabled && toggleWindow(w.path)}
                                />
                                {w.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 p-4 rounded-2xl font-black uppercase text-[12px] tracking-widest text-zinc-400 hover:bg-zinc-100 transition-all border border-border"
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={saving}
                  className="flex-[2] bg-primary text-white p-4 rounded-2xl font-black uppercase italic text-[12px] tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {saving ? 'Guardando…' : editing ? 'Guardar Cambios' : 'Crear Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
