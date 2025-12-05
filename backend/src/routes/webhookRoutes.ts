import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController';
import { tenantMiddleware } from '../middleware/tenantMiddleware';

const router = Router();

// Apply tenant middleware to identify the tenant from the shop header
router.post('/shopify', tenantMiddleware, WebhookController.handleWebhook);

export default router;
