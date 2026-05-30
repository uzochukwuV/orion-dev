/**
 * WhatsApp Integration — Webhook Handler
 * 
 * Receives incoming messages from Meta Webhooks API.
 * Handles both verification (GET) and incoming messages (POST).
 * 
 * WhatsApp Cloud API flow:
 * 1. User sends message to business WhatsApp number
 * 2. Meta forwards to our webhook
 * 3. We respond with chatbot message or acknowledge
 * 4. Optionally send outbound campaigns later
 */

import crypto from 'crypto';

const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || '';

/**
 * Verify webhook - called by Meta when setting up webhook
 * 
 * GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=xxx&hub.challenge=xxx
 */
export function verifyWebhook(mode: string, token: string, challenge: string): { success: boolean; challenge?: string } {
  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('[WhatsApp] Webhook verified successfully');
    return { success: true, challenge };
  }
  console.warn('[WhatsApp] Webhook verification failed - token mismatch');
  return { success: false };
}

/**
 * Verify that requests actually come from WhatsApp
 */
export function verifySignature(body: Buffer, signature: string | undefined): boolean {
  if (!signature || !APP_SECRET) return true;  // Skip if no secret configured
  
  const expectedSignature = crypto
    .createHmac('sha256', APP_SECRET)
    .update(body)
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}

/**
 * Parse incoming WhatsApp message from webhook payload
 */
export interface IncomingMessage {
  messageId: string;
  from: string;  // Phone number (with country code)
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contacts' | 'sticker' | 'reaction';
  text?: string;
  mediaUrl?: string;
  businessNumber: string;
}

export function parseIncomingMessage(payload: any): IncomingMessage | null {
  try {
    const value = payload.entry?.[0]?.changes?.[0]?.value;
    if (!value) return null;

    const message = value.messages?.[0];
    if (!message) return null;

    const incoming: IncomingMessage = {
      messageId: message.id,
      from: message.from,
      timestamp: message.timestamp,
      type: message.type,
      businessNumber: value.metadata?.phone_number_id || '',
    };

    if (message.type === 'text') {
      incoming.text = message.text?.body;
    } else if (message.type === 'image') {
      incoming.mediaUrl = message.image?.id;
    } else if (message.type === 'audio') {
      incoming.mediaUrl = message.audio?.id;
    }

    return incoming;
  } catch (error) {
    console.error('[WhatsApp] Failed to parse incoming message:', error);
    return null;
  }
}

/**
 * Extract phone number from "from" field (remove country code formatting)
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, '');
}

/**
 * Format phone for WhatsApp API (with country code)
 */
export function formatPhoneForApi(phone: string): string {
  const normalized = normalizePhone(phone);
  return normalized.startsWith('+') ? normalized : `+${normalized}`;
}