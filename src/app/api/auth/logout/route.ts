import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const userId = body?.userId;

        if (userId) {
            // 1. Find and close the active shift
            const activeShift = await (await import('@/lib/db')).prisma.shift.findFirst({
                where: {
                    userId,
                    endTime: null
                },
                orderBy: {
                    startTime: 'desc'
                }
            });

            if (activeShift) {
                await (await import('@/lib/db')).prisma.shift.update({
                    where: { id: activeShift.id },
                    data: { endTime: new Date() }
                });
            }
        }

        // 2. Clear signed cookie
        const response = NextResponse.json({ success: true });
        response.cookies.delete(SESSION_COOKIE_NAME);

        return response;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
