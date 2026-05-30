/**
 * WhatsApp Routes — Webhook endpoints and campaign management
 * 
 * Mounted at /api/whatsapp
 * 
 * Endpoints:
 *   GET  /webhook         — Webhook verification (Meta calls this to verify)
 *   POST /webhook         — Receive incoming messages
 *   POST /connect         — Connect WhatsApp business account
 *   POST /disconnect      — Disconnect WhatsApp
 *   GET  /status          — Check WhatsApp connection status
 *   POST /send-campaign   — Send campaign to recipients
 */

import { Router, Request, Response, NextFunction } from 'express';
import { verifyWebhook, parseIncomingMessage, verifySignature } from './webhookHandler.js';
import { routeMessage, sendCampaignMessage, sendBulkCampaign, clearSession } from './messageRouter.js';
import { sendTextMessage, isConfigured, sendTemplateMessage } from './client.js';
import { BusinessModel } from '../db/models/Business.js';
import { LeadModel } from '../db/models/Lead.js';
import { verifyJWT } from '../auth/middleware.js';

const router = Router();

// ─── Webhook Endpoints ────────────────────────────────────────────────────────

/**
 * GET /api/whatsapp/webhook
 * Webhook verification from Meta
 */
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  const result = verifyWebhook(mode, token, challenge);

  if (result.success && result.challenge) {
    res.status(200).send(result.challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

/**
 * POST /api/whatsapp/webhook
 * Receive incoming messages from Meta
 */
router.post('/webhook', async (req: Request, res: Response) => {
  // Verify signature
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const rawBody = req.body;  // express.raw was used in index.ts
  
  if (!verifySignature(Buffer.from(JSON.stringify(rawBody)), signature)) {
    console.warn('[WhatsApp] Invalid webhook signature');
    res.status(403).send('Invalid signature');
    return;
  }

  // Acknowledge receipt immediately
  res.status(200).send('OK');

  // Parse message
  const message = parseIncomingMessage(rawBody);
  if (!message) {
    console.log('[WhatsApp] No message in payload (might be delivery receipt)');
    return;
  }

  console.log(`[WhatsApp] Incoming message from ${message.from}: ${message.type === 'text' ? message.text : `[${message.type}]`}`);

  // Find business by WhatsApp phone number
  // In production, you'd maintain a phone_number_id -> business mapping
  // For now, find by whatsapp_phone match or use first connected business
  try {
    const business = await BusinessModel.findOne({ whatsapp_connected: true }).lean();
    
    if (!business) {
      console.warn('[WhatsApp] No connected business found');
      // Still acknowledge - don't send error to Meta
      return;
    }

    // Route message through AI and send response
    await routeMessage(message, business._id.toString());
  } catch (error) {
    console.error('[WhatsApp] Error routing message:', error);
  }
});

// ─── Business Connection Endpoints ───────────────────────────────────────────

/**
 * POST /api/whatsapp/connect
 * Connect WhatsApp business account to a business
 */
router.post('/connect', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone_number_id, access_token, webhook_verify_token } = req.body;
    const userId = req.user!.id;

    // Validate required fields
    if (!phone_number_id || !access_token) {
      res.status(400).json({ error: 'phone_number_id and access_token are required' });
      return;
    }

    // Get user's business
    const User = (await import('../db/models/User.js')).UserModel;
    const user = await User.findById(userId);
    
    if (!user?.business_id) {
      res.status(400).json({ error: 'No business linked to this account' });
      return;
    }

    // Update business with WhatsApp credentials
    await BusinessModel.findByIdAndUpdate(user.business_id, {
      whatsapp_connected: true,
      whatsapp_phone: phone_number_id,
      // Store in env instead for security - just mark as connected
    });

    res.json({
      message: 'WhatsApp connected successfully',
      webhook_url: `${process.env.BASE_URL || 'https://your-domain.com'}/api/whatsapp/webhook`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/whatsapp/disconnect
 * Disconnect WhatsApp from business
 */
router.post('/disconnect', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Get user's business
    const User = (await import('../db/models/User.js')).UserModel;
    const user = await User.findById(userId);
    
    if (!user?.business_id) {
      res.status(400).json({ error: 'No business linked to this account' });
      return;
    }

    // Update business - mark as disconnected
    await BusinessModel.findByIdAndUpdate(user.business_id, {
      whatsapp_connected: false,
      whatsapp_phone: '',
    });

    res.json({ message: 'WhatsApp disconnected' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/whatsapp/status
 * Check WhatsApp connection status
 */
router.get('/status', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Get user's business
    const User = (await import('../db/models/User.js')).UserModel;
    const user = await User.findById(userId);
    
    if (!user?.business_id) {
      res.status(400).json({ error: 'No business linked to this account' });
      return;
    }

    const business = await BusinessModel.findById(user.business_id).lean();

    res.json({
      connected: business?.whatsapp_connected || false,
      phone: business?.whatsapp_phone || null,
      configured: isConfigured(),
      webhook_url: `${process.env.BASE_URL || 'https://your-domain.com'}/api/whatsapp/webhook`,
    });
  } catch (error) {
    next(error);
  }
});

// ─── Campaign Endpoints ────────────────────────────────────────────────────────

/**
 * POST /api/whatsapp/send-campaign
 * Send campaign message to recipients
 */
router.post('/send-campaign', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { template, recipient_type, recipient_ids, variables } = req.body;
    const userId = req.user!.id;

    if (!template || !recipient_type) {
      res.status(400).json({ error: 'template and recipient_type are required' });
      return;
    }

    // Get user's business
    const User = (await import('../db/models/User.js')).UserModel;
    const user = await User.findById(userId);
    
    if (!user?.business_id) {
      res.status(400).json({ error: 'No business linked to this account' });
      return;
    }

    let recipients: string[] = [];

    if (recipient_type === 'leads') {
      // Get leads for this business
      const leads = await LeadModel.find({
        business_id: user.business_id.toString(),
        phone: { $exists: true, $ne: '' },
      }).lean();

      // Filter by provided IDs if specified
      recipients = leads
        .filter(l => !recipient_ids || recipient_ids.includes(l._id.toString()))
        .map(l => l.phone!)
        .filter(p => p);
    } else if (recipient_type === 'all') {
      // Get all leads
      const leads = await LeadModel.find({
        business_id: user.business_id.toString(),
        phone: { $exists: true, $ne: '' },
      }).lean();
      recipients = leads.map(l => l.phone!).filter(p => p);
    }

    if (recipients.length === 0) {
      res.status(400).json({ error: 'No recipients found' });
      return;
    }

    // Send to all recipients
    const result = await sendBulkCampaign(recipients, template, variables);

    res.json({
      message: `Campaign sent`,
      total: recipients.length,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors.slice(0, 5),  // First 5 errors
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/whatsapp/send-direct
 * Send a single message to a specific phone
 */
router.post('/send-direct', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      res.status(400).json({ error: 'to and message are required' });
      return;
    }

    const result = await sendTextMessage(to, message);

    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    next(error);
  }
});

// ─── Testing Endpoints ────────────────────────────────────────────────────────

/**
 * POST /api/whatsapp/test-reply
 * Send a test reply (for development)
 */
router.post('/test-reply', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      res.status(400).json({ error: 'to and message are required' });
      return;
    }

    // Validate WhatsApp is configured
    if (!isConfigured()) {
      res.status(400).json({ 
        error: 'WhatsApp not configured',
        hint: 'Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in environment'
      });
      return;
    }

    const result = await sendTextMessage(to, `[TEST] ${message}`);

    res.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    });
  } catch (error) {
    next(error);
  }
});

export default router;