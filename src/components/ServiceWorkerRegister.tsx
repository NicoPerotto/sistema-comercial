'use client';

import { useEffect } from 'react';

/**
 * Registra el service worker (public/sw.js) en el cliente.
 * Solo en producción (en dev Next recarga constantemente y el SW cachea
 * assets viejos, rompiendo el HMR). También escucha cambios de versión y
 * avisa al SW que se active.
 */
export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator)) return;
        if (process.env.NODE_ENV !== 'production') return;

        const register = async () => {
            try {
                const reg = await navigator.serviceWorker.register('/sw.js');
                console.log('[SW] registrado', reg.scope);

                // Si hay un SW esperando, activarlo en cuanto la página se cierre/oculte.
                reg.addEventListener('updatefound', () => {
                    const installing = reg.installing;
                    installing?.addEventListener('statechange', () => {
                        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                            installing.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                });
            } catch (err) {
                console.error('[SW] falló el registro', err);
            }
        };

        window.addEventListener('load', register);
        return () => window.removeEventListener('load', register);
    }, []);

    return null;
}
