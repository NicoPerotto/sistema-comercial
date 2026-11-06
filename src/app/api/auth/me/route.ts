import { NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/session';
import { resolveRoleAccess } from '@/lib/role-access';

export async function GET(request: Request) {
    try {
        const cookie = request.headers.get('cookie') || '';
        const match = cookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
        const token = match ? match[1] : null;

        if (!token) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        const user = await verifySession(token);
        if (!user) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        const access = user.id
            ? await resolveRoleAccess(user.id, user.role)
            : { isAdmin: false, windows: [], actions: [] };

        // Sin roleRef asignado (y no es admin por string) => no ve ninguna ventana (se lo saca del sistema).
        if (!access.isAdmin && access.windows.length === 0) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        return NextResponse.json({
            user: {
                ...user,
                windows: access.windows,
                actions: access.actions,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
