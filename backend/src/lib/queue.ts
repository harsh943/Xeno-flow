import { Queue, Worker } from 'bullmq';
import { IngestionService } from '../services/ingestionService';

const connection = process.env.REDIS_URL 
  ? { url: process.env.REDIS_URL }
  : { host: 'localhost', port: 6379 };

export const webhookQueue = new Queue('webhook-queue', { connection });

export const initWorker = () => {
  const worker = new Worker(
    'webhook-queue',
    async (job) => {
      console.log(`Processing job ${job.id} of type ${job.name}`);
      const { topic, payload, tenantId } = job.data;

      try {
        if (topic === 'orders/create' || topic === 'orders/updated') {
          await IngestionService.handleOrderCreated(payload, tenantId);
        } else if (topic === 'products/create' || topic === 'products/update') {
          await IngestionService.handleProductUpdate(payload, tenantId);
        } else if (topic === 'checkouts/create' || topic === 'checkouts/update') {
          await IngestionService.handleCheckoutUpdate(payload, tenantId);
        } else {
          console.warn(`Unknown topic: ${topic}`);
        }
      } catch (error) {
        console.error(`Failed to process job ${job.id}:`, error);
        throw error;
      }
    },
    { connection }
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed!`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with ${err.message}`);
  });

  console.log('Worker initialized and listening for jobs...');
};
