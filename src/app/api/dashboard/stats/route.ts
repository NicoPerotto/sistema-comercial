import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import {
    startOfDay,
    endOfDay,
    subDays,
    startOfMonth,
    startOfYear,
    format
} from 'date-fns';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'today';

        let startDate = startOfDay(new Date());
        const endDate = endOfDay(new Date());

        if (period === 'last7days') {
            startDate = startOfDay(subDays(new Date(), 7));
        } else if (period === 'month') {
            startDate = startOfMonth(new Date());
        } else if (period === 'year') {
            startDate = startOfYear(new Date());
        }

        // Fetch sales with items, products and categories
        const sales = await prisma.sale.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                type: 'VENTA',
                status: 'COMPLETED'
            },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                category: true
                            }
                        }
                    }
                },
                paymentMethod: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Fixed Costs
        const fixedCosts = await prisma.fixedCost.findMany({
            where: {
                date: { gte: startDate, lte: endDate }
            }
        });

        // 1. Calculations
        const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
        const transactionCount = sales.length;
        const avgTicket = transactionCount > 0 ? totalRevenue / transactionCount : 0;

        let totalCost = 0;
        sales.forEach(s => {
            s.items.forEach(item => {
                const cost = Number(item.product.cost || 0);
                totalCost += cost * Number(item.quantity);
            });
        });
        const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + Number(c.amount), 0);
        const estimatedProfit = totalRevenue - totalCost - totalFixedCosts;

        // 2. Timeline
        const timelineMap = new Map<string, number>();
        sales.forEach(s => {
            let key = '';
            if (period === 'today') {
                key = format(s.createdAt, 'HH:00');
            } else if (period === 'last7days') {
                key = format(s.createdAt, 'dd/MM');
            } else {
                key = format(s.createdAt, 'dd/MM');
            }
            timelineMap.set(key, (timelineMap.get(key) || 0) + Number(s.total));
        });
        const salesTimeline = Array.from(timelineMap.entries()).map(([name, total]) => ({ name, total }));

        // 3. Category distribution
        const categoryMap = new Map<string, number>();
        sales.forEach(s => {
            s.items.forEach(item => {
                const catName = item.product.category?.name || 'Varios';
                categoryMap.set(catName, (categoryMap.get(catName) || 0) + (Number(item.price) * Number(item.quantity)));
            });
        });
        const categoryDistribution = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

        // 4. Top Products
        const productMap = new Map<string, number>();
        sales.forEach(s => {
            s.items.forEach(item => {
                productMap.set(item.product.name, (productMap.get(item.product.name) || 0) + Number(item.quantity));
            });
        });
        const topProducts = Array.from(productMap.entries())
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        // 5. Payment Methods
        const paymentMap = new Map<string, number>();
        sales.forEach(s => {
            const pmName = s.paymentMethod?.name || 'Efectivo';
            paymentMap.set(pmName, (paymentMap.get(pmName) || 0) + Number(s.total));
        });
        const paymentMethods = Array.from(paymentMap.entries()).map(([name, value]) => ({ name, value }));

        return NextResponse.json({
            summary: {
                totalRevenue,
                transactionCount,
                avgTicket,
                estimatedProfit
            },
            salesTimeline,
            categoryDistribution,
            topProducts,
            paymentMethods
        });
    } catch (error: any) {
        console.error('Dashboard Stats Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
