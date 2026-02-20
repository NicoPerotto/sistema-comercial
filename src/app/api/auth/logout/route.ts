import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // 1. Find and close the active shift
        const activeShift = await prisma.shift.findFirst({
            where: {
                userId,
                endTime: null
            },
            orderBy: {
                startTime: 'desc'
            }
        });

        if (activeShift) {
            await prisma.shift.update({
                where: { id: activeShift.id },
                data: { endTime: new Date() }
            });
        }

        // 2. Clear cookie
        const response = NextResponse.json({ success: true });
        response.cookies.delete('user_session');

        return response;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
