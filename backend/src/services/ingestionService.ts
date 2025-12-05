import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';

export class IngestionService {
  
  /**
   * Handles the 'orders/create' or 'orders/updated' webhook.
   * Ensures idempotency and data consistency via transactions.
   */
  static async handleOrderCreated(payload: any, tenantId: string) {
    const { id: shopifyOrderId, customer: shopifyCustomer, total_price, currency, name: orderNumber } = payload;
    
    if (!shopifyCustomer) {
      console.warn(`Order ${shopifyOrderId} has no customer. Skipping customer update.`);
      // We might still want to save the order, but for this exercise we assume orders belong to customers.
      return;
    }

    const shopifyCustomerId = String(shopifyCustomer.id);
    const orderPrice = new Prisma.Decimal(total_price);

    // START TRANSACTION
    await prisma.$transaction(async (tx) => {
      // 1. Upsert Customer
      // We use upsert to handle race conditions if multiple orders come in for a new customer simultaneously.
      const customer = await tx.customer.upsert({
        where: {
          tenant_id_shopify_id: {
            tenant_id: tenantId,
            shopify_id: shopifyCustomerId,
          },
        },
        update: {
          email: shopifyCustomer.email,
          first_name: shopifyCustomer.first_name,
          last_name: shopifyCustomer.last_name,
          updated_at: new Date(),
        },
        create: {
          tenant_id: tenantId,
          shopify_id: shopifyCustomerId,
          email: shopifyCustomer.email,
          first_name: shopifyCustomer.first_name,
          last_name: shopifyCustomer.last_name,
          // total_spend and orders_count default to 0
        },
      });

      // 2. Upsert Order
      // Idempotency: If order exists, we update it. If not, create.
      // Note: If we receive the SAME webhook twice, this is safe.
      const order = await tx.order.upsert({
        where: {
          tenant_id_shopify_id: {
            tenant_id: tenantId,
            shopify_id: String(shopifyOrderId),
          },
        },
        update: {
          total_price: orderPrice,
          currency: currency,
          updated_at: new Date(),
        },
        create: {
          tenant_id: tenantId,
          shopify_id: String(shopifyOrderId),
          order_number: orderNumber,
          total_price: orderPrice,
          currency: currency,
          customer_id: customer.id,
        },
      });

      // 3. Recalculate Customer Totals
      // To be strictly consistent, we can aggregate all orders for this customer.
      // This avoids "double counting" if we just incremented.
      // However, for high scale, aggregation might be expensive. 
      // Given the requirement for "Rigor of a financial ledger", aggregation is safer than incrementing 
      // because incrementing is not idempotent if the same webhook is processed twice (unless we check if order was newly created).
      // Since we are upserting the order, we don't easily know if it was inserted or updated without checking return values or complex logic.
      // A robust approach: Aggregate.
      
      const aggregates = await tx.order.aggregate({
        where: {
          tenant_id: tenantId,
          customer_id: customer.id,
        },
        _sum: {
          total_price: true,
        },
        _count: {
          id: true,
        },
      });

      await tx.customer.update({
        where: { id: customer.id },
        data: {
          total_spend: aggregates._sum.total_price || 0,
          orders_count: aggregates._count.id || 0,
        },
      });
    });
    // END TRANSACTION
  }

  static async handleProductUpdate(payload: any, tenantId: string) {
    const { id: shopifyProductId, title, variants } = payload;
    const price = variants && variants.length > 0 ? variants[0].price : 0;

    await prisma.product.upsert({
      where: {
        tenant_id_shopify_id: {
          tenant_id: tenantId,
          shopify_id: String(shopifyProductId),
        },
      },
      update: {
        title: title,
        price: price,
        updated_at: new Date(),
      },
      create: {
        tenant_id: tenantId,
        shopify_id: String(shopifyProductId),
        title: title,
        price: price,
      },
    });
  }

  static async handleCheckoutUpdate(payload: any, tenantId: string) {
    const { id: shopifyCheckoutId, total_price, currency, abandoned_checkout_url, completed_at, customer } = payload;

    // Optional: Upsert customer if present (Checkouts can be guest)
    // For simplicity, we won't link to customer if they are guest, or we could create a "Guest" customer.
    // Here we only link if customer object exists.
    
    await prisma.checkout.upsert({
      where: {
        tenant_id_shopify_id: {
          tenant_id: tenantId,
          shopify_id: String(shopifyCheckoutId),
        },
      },
      update: {
        total_price: total_price,
        currency: currency,
        abandoned_checkout_url: abandoned_checkout_url,
        completed_at: completed_at ? new Date(completed_at) : null,
        updated_at: new Date(),
      },
      create: {
        tenant_id: tenantId,
        shopify_id: String(shopifyCheckoutId),
        total_price: total_price,
        currency: currency,
        abandoned_checkout_url: abandoned_checkout_url,
        completed_at: completed_at ? new Date(completed_at) : null,
      },
    });
  }
}
