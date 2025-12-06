import express from 'express';
import cors from 'cors';
import webhookRoutes from './routes/webhookRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import authRoutes from './routes/authRoutes';
import crypto from 'crypto';

const app = express();

app.use(cors());

app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use('/webhooks', webhookRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Multi-Tenant Shopify Ingestion Service is Running');
});

export default app;
