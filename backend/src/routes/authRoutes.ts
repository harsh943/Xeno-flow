import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { owner_email: email },
    });

    if (!tenant) {
      return res.status(401).json({ error: 'Invalid email or tenant not found' });
    }

    res.json({ tenantId: tenant.id, name: tenant.name });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
