import { NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/session';
import { prisma } from '@/lib/db';
import { APP_WINDOWS } from '@/lib/windows';

// Labels de las ventanas siempre visibles para ADMIN
const ADMIN_WINDOWS = APP_WINDOWS.map((w) => w.path);

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

        // Resolver ventanas permitidas según el rol del usuario
        let allowedWindows: string[] = [];
        if (user.role === 'ADMIN') {
            allowedWindows = ADMIN_WINDOWS;
        } else if (user.id) {
            const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                include: { roleRef: true },
            });
            if (dbUser?.roleRef) {
                try {
                    const perms = JSON.parse(dbUser.roleRef.permissions);
                    allowedWindows = Array.isArray(perms?.windows) ? perms.windows : [];
                } catch {
                    allowedWindows = [];
                }
            }
        }

        return NextResponse.json({
            user: {
                ...user,
                windows: allowedWindows,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
