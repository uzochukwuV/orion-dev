/**
 * Clerk Webhook Handler
 *
 * Handles user.created, user.updated, user.deleted webhooks from Clerk
 * Keeps ClerkUser and Business records in sync with Clerk
 */

import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { ClerkUserModel } from '../db/models/ClerkUser.js';
import { BusinessModel } from '../db/models/Business.js';

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
  try {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');
    const evt = wh.verify(JSON.stringify(req.body), req.headers as Record<string, string>) as ClerkEvent;

    console.log(`[Clerk Webhook] Event: ${evt.type}`);

    if (evt.type === 'user.created') {
      const { id, email_addresses, first_name, last_name } = evt.data;

      // Get email
      const email = email_addresses?.[0]?.email_address;
      if (!email) {
        console.warn('[Clerk] No email in user.created event');
        res.json({ ok: true });
        return;
      }

      // Create ClerkUser
      const user = await ClerkUserModel.create({
        clerk_id: id,
        email,
        name: `${first_name || ''} ${last_name || ''}`.trim() || email,
      });

      console.log(`[Clerk] Created user: ${user.clerk_id}`);

      // Create default business
      const business = await BusinessModel.create({
        user_id: user._id,
        name: `${user.name}'s Business`,
        city: 'Austin, TX',
        phone: '',
        website: '',
      });

      console.log(`[Clerk] Created business: ${business._id}`);

      // Link business to user
      user.business_id = business._id;
      await user.save();

      res.json({ ok: true });
    } else if (evt.type === 'user.updated') {
      const { id, email_addresses, first_name, last_name } = evt.data;

      const email = email_addresses?.[0]?.email_address;
      const name = `${first_name || ''} ${last_name || ''}`.trim();

      // Update user
      await ClerkUserModel.findOneAndUpdate(
        { clerk_id: id },
        {
          email,
          name: name || email,
          updated_at: new Date(),
        }
      );

      console.log(`[Clerk] Updated user: ${id}`);

      res.json({ ok: true });
    } else if (evt.type === 'user.deleted') {
      const { id } = evt.data;

      // Get user to find business
      const user = await ClerkUserModel.findOne({ clerk_id: id });

      if (user) {
        // Delete user
        await ClerkUserModel.findOneAndDelete({ clerk_id: id });

        // Delete business and related data
        if (user.business_id) {
          await BusinessModel.findByIdAndDelete(user.business_id);
          console.log(`[Clerk] Deleted business: ${user.business_id}`);
        }

        console.log(`[Clerk] Deleted user: ${id}`);
      }

      res.json({ ok: true });
    } else {
      console.log(`[Clerk] Unhandled event type: ${evt.type}`);
      res.json({ ok: true });
    }
  } catch (error) {
    console.error('[Clerk Webhook Error]', error);
    res.status(400).json({ error: 'Invalid webhook signature' });
  }
}
