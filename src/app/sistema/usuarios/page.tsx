'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Icon } from '@/components/Icons';

interface RoleOption { id: string; name: string; slug: string; }
interface Usuario {
  id: string;
  name: string;
  email: string | null;
  username: string;
  role: string;
  roleId: string | null;
  roleName: string | null;
  lastSession: string | null;
}

export default function UsuariosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', roleId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user?.role !== 'ADMIN') router.replace('/');
  }, [authLoading, user, router]);

  const fetchData = async () => {
    try {
      const [uRes, rRes] = await Promise.all([
        fetch('/api/usuarios'),
        fetch('/api/roles'),
      ]);
      if (uRes.ok) setUsuarios(await uRes.json());
      if (rRes.ok) setRoles(await rRes.json());
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchData();
  }, [user]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', username: '', password: '', roleId: roles[0]?.id || '' });
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (u: Usuario) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email || '', username: u.username, password: '', roleId: u.roleId || '' });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch('/api/usuarios', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setEditing(null);
        fetchData();
      } else {
        setError(data.error || 'Error al guardar');
      }
    } catch {
      setError('Error de red');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      const res = await fetch(`/api/usuarios?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
      else { const d = await res.json(); setError(d.error || 'Error al eliminar'); }
    } catch { setError('Error de red'); }
  };

  if (authLoading || (user?.role !== 'ADMIN')) {
    return (
      <main className="flex-1 flex flex-col p-6 lg:p-10 text-foreground">
        <p className="text-text-muted">Cargando…</p>
      </main>
    );
  }

  const fmt = (s: string | null) => s ? new Date(s).toLocaleString() : 'Nunca';

  return (
    <main className="flex-1 flex flex-col p-6 lg:p-10 space-y-8 overflow-y-auto text-foreground">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-primary">Usuarios</h1>
          <p className="text-foreground/60 font-medium">Creá y asigná roles a los usuarios del sistema</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-black uppercase italic tracking-tighter transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
        >
          <Icon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></Icon>
          Nuevo Usuario
        </button>
      </header>

      {error && <div className="bg-danger-subtle text-danger border border-danger/20 px-4 py-3 rounded-xl text-sm font-semibold">{error}</div>}

      {loading ? (
        <p className="text-text-muted">Cargando…</p>
      ) : (
        <div className="glass border border-border rounded-3xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase text-zinc-400 tracking-widest border-b border-border">
                <th className="p-4">Nombre</th>
                <th className="p-4">Usuario</th>
                <th className="p-4">Rol</th>
                <th className="p-4">Última Sesión</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-card/30">
                  <td className="p-4 font-bold text-primary">{u.name}</td>
                  <td className="p-4 text-text-muted">{u.username}</td>
                  <td className="p-4 text-text-muted">{u.roleName || u.role}</td>
                  <td className="p-4 text-text-muted">{fmt(u.lastSession)}</td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(u)} className="p-2 bg-card/80 hover:bg-card rounded-xl border border-border text-primary transition-all" title="Editar"><Icon className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></Icon></button>
                      <button onClick={() => handleDelete(u.id)} className="p-2 bg-red-50 hover:bg-danger-subtle rounded-xl border border-red-200 text-danger transition-all" title="Eliminar"><Icon className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></Icon></button>
                    </div>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && <tr><td colSpan={5} className="p-4 text-text-muted">No hay usuarios.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-lg rounded-3xl p-8 border border-white/20 shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-primary-dark" />
            <header className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-primary uppercase italic tracking-tighter">{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all"><Icon><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></Icon></button>
            </header>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Nombre</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-card/50 border border-border rounded-2xl p-3 font-bold text-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Usuario</label>
                <input type="text" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full bg-card/50 border border-border rounded-2xl p-3 font-bold text-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-card/50 border border-border rounded-2xl p-3 font-bold text-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Contraseña {editing && '(dejar en blanco para no cambiar)'}</label>
                <input type="password" required={!editing} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full bg-card/50 border border-border rounded-2xl p-3 font-bold text-primary outline-none" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Rol</label>
                <select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} className="w-full bg-card/50 border border-border rounded-2xl p-3 font-bold text-primary outline-none">
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-4 rounded-2xl font-black uppercase text-[12px] tracking-widest text-zinc-400 hover:bg-zinc-100 transition-all border border-border">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-[2] bg-primary text-white p-4 rounded-2xl font-black uppercase italic text-[12px] tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">{saving ? 'Guardando…' : editing ? 'Guardar Cambios' : 'Crear Usuario'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
