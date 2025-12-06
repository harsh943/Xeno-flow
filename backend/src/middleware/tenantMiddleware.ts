import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;

    let tenant;

    if (tenantId) {
      tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    } else if (shopDomain) {
      tenant = await prisma.tenant.findUnique({ where: { shop_domain: shopDomain } });
    }

    if (!tenant) {
      return res.status(401).json({ error: 'Tenant not found or unidentified' });
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
