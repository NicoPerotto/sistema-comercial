import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { resolveRequestRoleAccess } from '@/lib/role-access';
import { CREATE_CREDIT_CUSTOMERS } from '@/lib/role-permissions';

/** Normaliza campos opcionales: strings vacíos se guardan como NULL. */
function optional(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function round2(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Límite de crédito: vacío/null = sin límite; debe ser un número >= 0. */
function parseCreditLimit(value: unknown): number | null | 'INVALID' {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 'INVALID';
    return round2(n);
}

function withBalance(customer: any) {
    const totalCharged = customer.sales.reduce(
        (sum: number, sale: any) => sum + Number(sale.total),
        0
    );
    const totalPaid = customer.payments.reduce(
        (sum: number, payment: any) => sum + Number(payment.appliedAmount ?? payment.amount),
        0
    );

    const lastSale = customer.sales[0];
    const lastPayment = customer.payments[0];
    const balance = round2(totalCharged - totalPaid);
    const creditLimit =
        customer.creditLimit === null || customer.creditLimit === undefined
            ? null
            : round2(Number(customer.creditLimit));

    return {
        id: customer.id,
        name: customer.name,
        dni: customer.dni,
        phone: customer.phone,
        address: customer.address,
        email: customer.email,
        active: customer.active,
        creditLimit,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        totalCharged: round2(totalCharged),
        totalPaid: round2(totalPaid),
        balance,
        available: creditLimit === null ? null : round2(creditLimit - balance),
        overLimit: creditLimit !== null && balance > creditLimit + 0.01,
        salesCount: customer.sales.length,
        lastPurchaseAt: lastSale?.createdAt ?? null,
        lastPaymentAt: lastPayment?.createdAt ?? null,
    };
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const onlyActive = ['1', 'true'].includes(searchParams.get('active') || '');
        const onlyDebtors = ['1', 'true'].includes(searchParams.get('debtors') || '');

        const customers = await (prisma as any).creditCustomer.findMany({
            where: onlyActive ? { active: true } : undefined,
            include: {
                sales: {
                    where: { status: 'COMPLETED' },
                    select: { id: true, total: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                },
                payments: {
                    select: { id: true, amount: true, appliedAmount: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { name: 'asc' },
        });

        let data = customers.map(withBalance);
        if (onlyDebtors) {
            data = data.filter((customer: any) => Number(customer.balance) > 0.009);
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('API Error CreditCustomers GET:', error);
        return NextResponse.json({ error: error.message || 'Error al cargar clientes' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const access = await resolveRequestRoleAccess(request);
        if (!access) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }
        if (
            !access.isAdmin &&
            (!access.windows.includes('/a-cuenta') || !access.actions.includes(CREATE_CREDIT_CUSTOMERS))
        ) {
            return NextResponse.json({ error: 'No tenés permiso para crear clientes a cuenta' }, { status: 403 });
        }

        const body = await request.json();
        const name = optional(body.name);
        const dni = optional(body.dni);
        const creditLimit = parseCreditLimit(body.creditLimit);

        if (!name) {
            return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
        }

        if (creditLimit === 'INVALID') {
            return NextResponse.json(
                { error: 'El límite de crédito debe ser un número mayor o igual a cero' },
                { status: 400 }
            );
        }

        if (dni) {
            const duplicate = await (prisma as any).creditCustomer.findUnique({ where: { dni } });
            if (duplicate) {
                return NextResponse.json({ error: 'Ya existe un cliente con ese DNI' }, { status: 400 });
            }
        }

        const customer = await (prisma as any).creditCustomer.create({
            data: {
                name,
                dni,
                phone: optional(body.phone),
                address: optional(body.address),
                email: optional(body.email),
                active: body.active !== false,
                creditLimit,
            },
        });

        return NextResponse.json(withBalance({ ...customer, sales: [], payments: [] }));
    } catch (error: any) {
        console.error('API Error CreditCustomers POST:', error);
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'Ya existe un cliente con ese DNI' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Error al crear cliente' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const id = body.id;
        const name = optional(body.name);
        const dni = optional(body.dni);
        const creditLimit = parseCreditLimit(body.creditLimit);

        if (!id || !name) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        if (creditLimit === 'INVALID') {
            return NextResponse.json(
                { error: 'El límite de crédito debe ser un número mayor o igual a cero' },
                { status: 400 }
            );
        }

        if (dni) {
            const duplicate = await (prisma as any).creditCustomer.findFirst({
                where: { dni, id: { not: id } },
            });
            if (duplicate) {
                return NextResponse.json({ error: 'Ya existe un cliente con ese DNI' }, { status: 400 });
            }
        }

        const customer = await (prisma as any).creditCustomer.update({
            where: { id },
            data: {
                name,
                dni,
                phone: optional(body.phone),
                address: optional(body.address),
                email: optional(body.email),
                creditLimit,
                ...(typeof body.active === 'boolean' ? { active: body.active } : {}),
            },
            include: {
                sales: {
                    where: { status: 'COMPLETED' },
                    select: { id: true, total: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                },
                payments: {
                    select: { id: true, amount: true, appliedAmount: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        return NextResponse.json(withBalance(customer));
    } catch (error: any) {
        console.error('API Error CreditCustomers PUT:', error);
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'Ya existe un cliente con ese DNI' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Error al actualizar cliente' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Falta el ID' }, { status: 400 });
        }

        const [salesCount, paymentsCount] = await Promise.all([
            (prisma as any).sale.count({ where: { creditCustomerId: id } }),
            (prisma as any).creditPayment.count({ where: { customerId: id } }),
        ]);

        if (salesCount > 0 || paymentsCount > 0) {
            return NextResponse.json(
                {
                    error: 'El cliente tiene ventas o pagos asociados. Podés desactivarlo en lugar de eliminarlo.',
                },
                { status: 400 }
            );
        }

        await (prisma as any).creditCustomer.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error CreditCustomers DELETE:', error);
        return NextResponse.json({ error: error.message || 'Error al eliminar cliente' }, { status: 500 });
    }
}
