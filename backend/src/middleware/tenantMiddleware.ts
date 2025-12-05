import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Try to get tenant from X-Tenant-ID (Dashboard/API calls)
    const tenantId = req.headers['x-tenant-id'] as string;
    
    // 2. Try to get tenant from Shopify Header (Webhooks)
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;

    let tenant;

    if (tenantId) {
      tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    } else if (shopDomain) {
      tenant = await prisma.tenant.findUnique({ where: { shop_domain: shopDomain } });
    }

    if (!tenant) {
      // For webhooks, we might want to log this and return 200 to stop retries if it's an invalid shop, 
      // but for now strict 401/404 is safer.
      return res.status(401).json({ error: 'Tenant not found or unidentified' });
    }

    // Inject tenant into request
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
