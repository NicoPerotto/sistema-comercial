import { NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/session';

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

        return NextResponse.json({ user });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
