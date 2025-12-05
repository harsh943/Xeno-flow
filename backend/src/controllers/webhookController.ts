import { Request, Response } from 'express';
import crypto from 'crypto';
import { webhookQueue } from '../lib/queue';

export class WebhookController {
  
  static async handleWebhook(req: Request, res: Response) {
    try {
      const hmac = req.headers['x-shopify-hmac-sha256'] as string;
      const topic = req.headers['x-shopify-topic'] as string;
      const shop = req.headers['x-shopify-shop-domain'] as string;
      
      if (!hmac || !topic || !shop) {
        return res.status(400).send('Missing headers');
      }

      // 1. Verify HMAC
      // Note: In a real Express app, we need the raw body. 
      // We'll assume body-parser is configured to verify or we access rawBody.
      // For this snippet, we'll assume req.body is already parsed JSON, 
      // which makes HMAC verification tricky without the raw buffer.
      // We will add a note or assume a rawBody middleware is used.
      
      const generatedHash = crypto
        .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
        .update(req.rawBody!) 
        .digest('base64');
      
      if (generatedHash !== hmac) {
        return res.status(401).send('Invalid HMAC');
      }

      // 2. Resolve Tenant (Middleware already did this, but let's double check)
      const tenant = req.tenant;
      if (!tenant) {
        return res.status(401).send('Tenant not found');
      }

      console.log(`Received webhook ${topic} for shop ${shop}`);

      // 3. Process Webhook (Async via Redis)
      await webhookQueue.add(topic, {
        topic,
        payload: req.body,
        tenantId: tenant.id
      });
      
      console.log(`Queued webhook ${topic} for shop ${shop}`);

      res.status(200).send('Webhook processed');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send('Internal Server Error');
    }
  }
}
