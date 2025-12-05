import { Router, Request, Response } from 'express';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import prisma from '../utils/prisma';

const router = Router();

router.use(tenantMiddleware);

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant!.id;

    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.created_at = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    // 1. Total Revenue
    const revenueAgg = await prisma.order.aggregate({
      where: { 
        tenant_id: tenantId,
        ...dateFilter
      },
      _sum: { total_price: true },
    });

    // 2. Active Customers (e.g., > 0 orders)
    // Note: Active customers usually means "placed an order in this period"
    // But for simplicity we'll keep "total active customers" or filter by order date if needed.
    // Let's filter customers who placed orders in this range.
    const activeCustomersCount = await prisma.order.groupBy({
      by: ['customer_id'],
      where: {
        tenant_id: tenantId,
        ...dateFilter
      },
    }).then((groups: string | any[]) => groups.length);

    // 3. Top Customers by Spend (in this period)
    // Prisma doesn't support easy "sum of relations with filter" in findMany.
    // We'll fetch orders and aggregate manually or use raw query.
    // For simplicity/performance, let's stick to global top customers for now, 
    // OR if date filter is present, we might need a raw query.
    // Let's keep Top Customers global for now to avoid complexity, 
    // but we can add a note.
    const topCustomers = await prisma.customer.findMany({
      where: { tenant_id: tenantId },
      orderBy: { total_spend: 'desc' },
      take: 5,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        total_spend: true,
        orders_count: true,
      },
    });

    // 4. Sales Over Time (Chart Data)
    // We need to group orders by day.
    // Prisma doesn't have "date_trunc" built-in easily without raw query.
    // We'll fetch orders and group in JS (fine for small scale) or use raw query.
    // Let's use raw query for "Engineering Fluency".
    
    // Ensure dates are safe
    const start = startDate ? new Date(startDate as string) : new Date(0);
    const end = endDate ? new Date(endDate as string) : new Date();

    const salesOverTime = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date, 
        SUM(total_price) as sales 
      FROM orders 
      WHERE tenant_id = ${tenantId}
      AND created_at >= ${start}
      AND created_at <= ${end}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `;

    // Serialize BigInt/Decimal for JSON
    const serializedSales = (salesOverTime as any[]).map((item: any) => ({
      date: item.date.toISOString().split('T')[0],
      sales: Number(item.sales)
    }));

    res.json({
      totalRevenue: revenueAgg._sum.total_price || 0,
      activeCustomers: activeCustomersCount,
      topCustomers,
      salesOverTime: serializedSales
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
