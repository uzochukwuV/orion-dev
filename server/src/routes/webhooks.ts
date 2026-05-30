/**
 * Clerk Webhook Handler
 *
 * Handles user.created, user.updated, user.deleted webhooks from Clerk
 */

import { Request, Response } from 'express';

// Clerk webhook event types
interface ClerkEventData {
  id: string;
  email_addresses?: Array<{ email_address?: string }>;
  first_name?: string;
  last_name?: string;
}

interface ClerkEvent {
  type: string;
  data: ClerkEventData;
}

export async function handleClerkWebhook(req: Request, res: Response): Promise<void> {
  // If CLERK_WEBHOOK_SECRET is not set, just acknowledge receipt
  if (!process.env.CLERK_WEBHOOK_SECRET) {
    res.status(200).json({ received: true, message: 'Clerk webhook not configured' });
    return;
  }

  try {
    const { Webhook } = await import('svix');
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const evt = wh.verify(JSON.stringify(req.body), req.headers as Record<string, string>) as ClerkEvent;
    
    console.log(`Clerk webhook received: ${evt.type}`);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Clerk webhook error:', error);
    res.status(400).json({ error: 'Webhook verification failed' });
  }
}
