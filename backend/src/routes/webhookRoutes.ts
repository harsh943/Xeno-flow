import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController';
import { tenantMiddleware } from '../middleware/tenantMiddleware';

const router = Router();

router.post('/shopify', tenantMiddleware, WebhookController.handleWebhook);

export default router;
