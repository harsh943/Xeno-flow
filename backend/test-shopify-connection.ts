import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const SHOP_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!SHOP_DOMAIN || !ACCESS_TOKEN) {
  console.error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ACCESS_TOKEN in .env');
  process.exit(1);
}

async function testConnection() {
  try {
    console.log(`Testing connection to ${SHOP_DOMAIN}...`);
    const response = await axios.get(`https://${SHOP_DOMAIN}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    console.log('Connection Successful!');
    console.log('Shop Name:', response.data.shop.name);
    console.log('Shop Email:', response.data.shop.email);
    console.log('Shop Domain:', response.data.shop.domain);
  } catch (error: any) {
    console.error('Connection Failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testConnection();
