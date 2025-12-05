import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.SHOPIFY_API_SECRET;
const URL = 'http://localhost:3003/webhooks/shopify';

if (!SECRET) {
  console.error('Error: SHOPIFY_API_SECRET is missing in .env');
  process.exit(1);
}

const orders = [
  {
    name: "Alice's Order",
    payload: {
      id: 1000001,
      email: "alice@example.com",
      created_at: new Date().toISOString(),
      total_price: "50.00",
      currency: "USD",
      order_number: 2001,
      customer: {
        id: "cust_1",
        email: "alice@example.com",
        first_name: "Alice",
        last_name: "Wonderland",
        orders_count: 3,
        total_spent: "200.00"
      }
    }
  },
  {
    name: "Bob's Order",
    payload: {
      id: 1000002,
      email: "bob@example.com",
      created_at: new Date().toISOString(),
      total_price: "75.00",
      currency: "USD",
      order_number: 2002,
      customer: {
        id: "cust_2",
        email: "bob@example.com",
        first_name: "Bob",
        last_name: "Builder",
        orders_count: 1,
        total_spent: "75.00"
      }
    }
  }
];

async function sendWebhooks() {
  for (const order of orders) {
    const body = JSON.stringify(order.payload);
    const hmac = crypto
      .createHmac('sha256', SECRET!)
      .update(body, 'utf8')
      .digest('base64');

    console.log(`Sending ${order.name}...`);
    
    try {
      const res = await axios.post(URL, order.payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-shopify-topic': 'orders/create',
          'x-shopify-shop-domain': 'demo.myshopify.com',
          'x-shopify-hmac-sha256': hmac
        }
      });
      console.log(`✅ Success: ${res.status} - ${order.name} processed`);
    } catch (err: any) {
      console.error(`❌ Error sending ${order.name}:`, err.response ? err.response.data : err.message);
    }
  }
}

sendWebhooks();
