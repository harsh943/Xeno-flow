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

    const revenueAgg = await prisma.order.aggregate({
      where: { 
        tenant_id: tenantId,
        ...dateFilter
      },
      _sum: { total_price: true },
    });

    const activeCustomersCount = await prisma.order.groupBy({
      by: ['customer_id'],
      where: {
        tenant_id: tenantId,
        ...dateFilter
      },
    }).then((groups: string | any[]) => groups.length);

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
