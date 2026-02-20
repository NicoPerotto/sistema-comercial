import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // 1. Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || user.password !== password) {
            return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
        }

        // 2. Close any previous open shifts (cleanup)
        await prisma.shift.updateMany({
            where: {
                userId: user.id,
                endTime: null
            },
            data: {
                endTime: new Date()
            }
        });

        // 3. Create new shift
        const shift = await prisma.shift.create({
            data: {
                userId: user.id,
                startTime: new Date()
            }
        });

        // 4. Return user info (excluding password)
        const { password: _, ...userWithoutPassword } = user;

        const response = NextResponse.json({
            user: userWithoutPassword,
            shiftId: shift.id
        });

        // Set a basic cookie for session (simplistic for this demo)
        response.cookies.set('user_session', JSON.stringify(userWithoutPassword), {
            path: '/',
            maxAge: 60 * 60 * 24, // 1 day
            httpOnly: false, // Accessible by client for UI
        });

        return response;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
