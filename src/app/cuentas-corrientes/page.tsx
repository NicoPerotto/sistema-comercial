import { redirect } from 'next/navigation';

/**
 * Compatibilidad: la ventana "Cuentas Corrientes" pasó a llamarse "A Cuenta".
 * Mantenemos este redirect para accesos guardados o links viejos.
 */
export default function LegacyCreditAccountsPage() {
    redirect('/a-cuenta');
}
