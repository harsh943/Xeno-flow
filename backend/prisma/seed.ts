import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // 1. Create a Tenant
  const tenant = await prisma.tenant.upsert({
    where: { shop_domain: 'demo.myshopify.com' },
    update: {},
    create: {
      name: 'Xeno Demo Store',
      shop_domain: 'demo.myshopify.com',
      owner_email: 'demo@xeno.com',
    },
  });

  console.log(`Created tenant: ${tenant.name} (${tenant.id})`);

  // 2. Create Dummy Customers
  const customer1 = await prisma.customer.upsert({
    where: {
      tenant_id_shopify_id: {
        tenant_id: tenant.id,
        shopify_id: 'cust_1',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      shopify_id: 'cust_1',
      first_name: 'Alice',
      last_name: 'Wonderland',
      email: 'alice@example.com',
      total_spend: 150.00,
      orders_count: 2,
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: {
      tenant_id_shopify_id: {
        tenant_id: tenant.id,
        shopify_id: 'cust_2',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      shopify_id: 'cust_2',
      first_name: 'Bob',
      last_name: 'Builder',
      email: 'bob@example.com',
      total_spend: 0.00,
      orders_count: 0,
    },
  });

  // 3. Create Dummy Orders
  // Order for Alice (Yesterday)
  await prisma.order.upsert({
    where: {
      tenant_id_shopify_id: {
        tenant_id: tenant.id,
        shopify_id: 'ord_1',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      shopify_id: 'ord_1',
      order_number: '1001',
      total_price: 50.00,
      currency: 'USD',
      customer_id: customer1.id,
      created_at: new Date(new Date().setDate(new Date().getDate() - 1)), // Yesterday
    },
  });

  // Order for Alice (Today)
  await prisma.order.upsert({
    where: {
      tenant_id_shopify_id: {
        tenant_id: tenant.id,
        shopify_id: 'ord_2',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      shopify_id: 'ord_2',
      order_number: '1002',
      total_price: 100.00,
      currency: 'USD',
      customer_id: customer1.id,
      created_at: new Date(), // Today
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
