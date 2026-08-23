'use client';

/**
 * Cola offline de ventas.
 *
 * Cuando el POST /api/sales falla por red (offline), la venta se guarda en
 * IndexedDB (con fallback a localStorage) y se reenvía automáticamente al
 * recuperar la conexión. Esto permite operar la caja sin internet y no perder
 * ventas. En Supabase (prod) las ventas se guardan igual; en local (sqlite)
 * también. El servidor es la fuente de verdad.
 */

const DB_NAME = 'comercial_offline';
const STORE = 'pending_sales';
const LS_KEY = 'pending_sales'; // fallback si no hay IndexedDB

export interface QueuedSale {
    id: string;            // uuid local
    payload: any;          // lo mismo que se enviaria a /api/sales
    createdAt: number;
    attempts: number;
}

function hasIDB(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: 'id' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function idbAll(): Promise<QueuedSale[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result as QueuedSale[]);
        req.onerror = () => reject(req.error);
    });
}

async function idbPut(sale: QueuedSale): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(sale);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function idbDelete(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

function lsAll(): QueuedSale[] {
    try {
        return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch {
        return [];
    }
}
function lsSave(list: QueuedSale[]) {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export async function enqueueSale(payload: any): Promise<QueuedSale> {
    const sale: QueuedSale = {
        id: (crypto.randomUUID?.() ?? `sale_${Date.now()}_${Math.random().toString(36).slice(2)}`),
        payload,
        createdAt: Date.now(),
        attempts: 0,
    };
    if (hasIDB()) {
        await idbPut(sale);
    } else {
        const list = lsAll();
        list.push(sale);
        lsSave(list);
    }
    return sale;
}

export async function pendingSales(): Promise<QueuedSale[]> {
    if (hasIDB()) {
        try {
            return await idbAll();
        } catch {
            return lsAll();
        }
    }
    return lsAll();
}

export async function removeSale(id: string): Promise<void> {
    if (hasIDB()) {
        try {
            await idbDelete(id);
            return;
        } catch {
            /* fallthrough a ls */
        }
    }
    lsSave(lsAll().filter((s) => s.id !== id));
}

/**
 * Intenta enviar una venta en cola. Devuelve true si el servidor la aceptó.
 */
export async function flushSale(sale: QueuedSale): Promise<boolean> {
    try {
        const res = await fetch('/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sale.payload),
        });
        if (res.ok) {
            await removeSale(sale.id);
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

/**
 * Reenvía todas las ventas en cola. Devuelve cuántas se enviaron con éxito.
 */
export async function flushAll(onProgress?: (done: number, total: number) => void): Promise<number> {
    const queue = await pendingSales();
    let done = 0;
    for (const sale of queue) {
        const ok = await flushSale(sale);
        if (ok) done++;
        onProgress?.(done, queue.length);
    }
    return done;
}
