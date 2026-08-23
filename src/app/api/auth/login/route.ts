import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signSession, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from '@/lib/session';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // 1. Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        // 2. Verify password (hashed). Usuario o clave inválidos -> 401 genérico.
        if (!user || !user.password || !bcrypt.compareSync(password, user.password)) {
            return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
        }

        // 3. Close any previous open shifts (cleanup)
        await prisma.shift.updateMany({
            where: {
                userId: user.id,
                endTime: null
            },
            data: {
                endTime: new Date()
            }
        });

        // 4. Create new shift
        const shift = await prisma.shift.create({
            data: {
                userId: user.id,
                startTime: new Date()
            }
        });

        // 5. Return user info (excluding password) + signed session cookie
        const { password: _, ...userWithoutPassword } = user;

        const token = await signSession({
            id: userWithoutPassword.id,
            name: userWithoutPassword.name,
            email: userWithoutPassword.email,
            role: userWithoutPassword.role,
        });

        const response = NextResponse.json({
            user: userWithoutPassword,
            shiftId: shift.id
        });

        response.cookies.set(SESSION_COOKIE_NAME, token, {
            path: '/',
            maxAge: SESSION_MAX_AGE,
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });

        return response;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
