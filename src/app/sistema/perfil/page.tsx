'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function MiPerfilPage() {
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: (user as any).name || '',
        email: (user as any).email || '',
        username: (user as any).username || '',
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/usuarios/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'ok', text: 'Datos actualizados correctamente.' });
        // Refrescar sesión para reflejar el nombre
        window.location.reload();
      } else {
        setMsg({ type: 'err', text: data.error || 'Error al actualizar' });
      }
    } catch {
      setMsg({ type: 'err', text: 'Error de red' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <main className="flex-1 flex flex-col p-6 lg:p-10 text-foreground">
        <p className="text-text-muted">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col p-6 lg:p-10 space-y-8 text-foreground">
      <header>
        <h1 className="text-4xl font-black tracking-tight text-primary">Mi Perfil</h1>
        <p className="text-foreground/60 font-medium">Editá tus datos personales</p>
      </header>

      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-semibold border ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-danger-subtle text-danger border-danger/20'}`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass border border-border rounded-3xl p-8 max-w-xl space-y-5 bg-card/30">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Nombre</label>
          <input
            type="text" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-card/50 border border-border rounded-2xl p-3 font-bold text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Email</label>
          <input
            type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-card/50 border border-border rounded-2xl p-3 font-bold text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Usuario</label>
          <input
            type="text" required value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full bg-card/50 border border-border rounded-2xl p-3 font-bold text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Contraseña (dejar en blanco para no cambiar)</label>
          <input
            type="password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full bg-card/50 border border-border rounded-2xl p-3 font-bold text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit" disabled={saving}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-black uppercase italic tracking-tighter shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar Cambios'}
        </button>
      </form>
    </main>
  );
}
