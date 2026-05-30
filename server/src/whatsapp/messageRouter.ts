/**
 * WhatsApp Message Router
 * 
 * Routes incoming messages through the AI agent and sends responses.
 * Manages conversation context and session state.
 */

import { IncomingMessage, normalizePhone } from './webhookHandler.js';
import { sendTextMessage, sendTextWithUrl, markAsRead, sendTemplateMessage } from './client.js';
import { runSuperAgent } from '../agents/index.js';
import { BusinessModel } from '../db/models/Business.js';
import { LeadModel } from '../db/models/Lead.js';

// Session storage (in production use Redis or similar)
const sessions = new Map<string, { businessId: string; lastMessage?: string; context?: any }>();

// Default AI greeting and help message
const AI_GREETING = `👋 Cześć! I'm your AI assistant from La Cucina. How can I help you today?

I can help you with:
• Making a reservation
• Viewing our menu
• Upcoming events and specials
• Answering questions about our restaurant
• And more!

Just type your question and I'll assist you.`;

// Quick reply options for menus
const MAIN_MENU_OPTIONS = [
  { id: 'menu', title: '📋 View Menu' },
  { id: 'reservations', title: '📅 Make Reservation' },
  { id: 'hours', title: '🕐 Hours & Location' },
  { id: 'specials', title: '🎉 Today\'s Specials' },
];

/**
 * Route incoming message to the AI agent and send response
 */
export async function routeMessage(
  message: IncomingMessage,
  businessId: string
): Promise<void> {
  const phone = normalizePhone(message.from);

  // Mark message as read
  await markAsRead(message.messageId);

  // Get or create session
  let session = sessions.get(phone);
  if (!session) {
    sessions.set(phone, { businessId });
    // Send greeting to new contacts
    await sendTextMessage(phone, AI_GREETING);
    return;
  }

  // Update session with last activity
  session.lastMessage = message.timestamp;

  // Handle different message types
  if (message.type === 'text' && message.text) {
    await handleTextMessage(phone, message.text, businessId, session);
  } else if (message.type === 'image') {
    await handleMediaMessage(phone, 'image', businessId, session);
  } else if (message.type === 'audio') {
    await handleMediaMessage(phone, 'audio', businessId, session);
  } else {
    await sendTextMessage(phone, "I received your message! For now, I can only handle text messages. Please type your question.");
  }
}

/**
 * Handle text messages through the AI agent
 */
async function handleTextMessage(
  phone: string,
  text: string,
  businessId: string,
  session: { businessId: string; lastMessage?: string; context?: any }
): Promise<void> {
  // Check for special commands
  const lowerText = text.toLowerCase().trim();
  
  if (lowerText === 'menu' || lowerText === 'karta' || lowerText === 'menuu') {
    await sendMenuInfo(phone, businessId);
    return;
  }
  
  if (lowerText === 'rezerwacja' || lowerText === 'rezerwacja' || lowerText === 'book') {
    await sendReservationInfo(phone, businessId);
    return;
  }
  
  if (lowerText === 'godziny' || lowerText === 'hours' || lowerText === 'lokalizacja') {
    await sendLocationInfo(phone, businessId);
    return;
  }

  // Route to AI agent
  try {
    const business = await BusinessModel.findById(businessId).lean();
    if (!business) {
      await sendTextMessage(phone, "Sorry, something went wrong. Please try again later.");
      return;
    }

    // Build context for the AI
    const context = {
      business_id: businessId,
      name: business.name,
      type: business.type,
      city: business.city,
      phone: business.phone,
      website: business.website,
      description: business.description,
      main_services: business.main_services,
      // Include session context for conversation continuity
      previous_topic: session.context?.topic,
      customer_phone: phone,
    };

    // Run through the AI agent
    const result = await runSuperAgent({
      task: text,
      businessId: businessId,
      options: { skipConfirmation: true },
      onStep: () => {},  // Silent for WhatsApp
    });

    // Send the response
    const reply = result.final_summary || "I'm not sure how to help with that. Could you rephrase your question?";

    // Truncate if too long (WhatsApp has limits)
    const truncatedReply = reply.length > 4096 ? reply.substring(0, 4090) + '...' : reply;
    
    await sendTextMessage(phone, truncatedReply);

    // Update session context
    session.context = {
      topic: detectTopic(text),
      lastInteraction: new Date().toISOString(),
    };

  } catch (error) {
    console.error('[WhatsApp Router] AI agent error:', error);
    await sendTextMessage(phone, "Sorry, I'm having trouble processing your request. Please try again or contact us directly.");
  }
}

/**
 * Handle media messages
 */
async function handleMediaMessage(
  phone: string,
  type: 'image' | 'audio',
  businessId: string,
  session: any
): Promise<void> {
  if (type === 'image') {
    await sendTextMessage(phone, "📷 Image received! Unfortunately, I can't view images yet. Could you describe what you'd like to know?");
  } else if (type === 'audio') {
    await sendTextMessage(phone, "🎤 Audio message received! For voice inquiries, please call us at our restaurant or type your question here.");
  }
}

// ─── Quick Response Handlers ──────────────────────────────────────────────────

async function sendMenuInfo(phone: string, businessId: string): Promise<void> {
  const business = await BusinessModel.findById(businessId).lean();
  
  if (!business) {
    await sendTextMessage(phone, "Sorry, I couldn't find menu information.");
    return;
  }

  const menuMessage = `📋 *Our Menu Highlights*

🍝 *Pasta* — Handmade daily
• Tagliatelle al Ragù — 42 PLN
• Cacio e Pepe — 38 PLN
• Spaghetti alle Vongole — 52 PLN

🍕 *Pizza* — Wood-fired oven
• Margherita — 36 PLN
• Quattro Formaggi — 45 PLN
• Prosciutto e Funghi — 48 PLN

🍷 *Wines* — Italian selection
• House Red (glass) — 18 PLN
• Prosecco — 22 PLN

📍 Visit us: ${business.address || 'ul. Floriańska 15, Kraków'}
📞 Call to book: ${business.phone || '+48 12 421 5555'}

Full menu: ${business.website || 'lacucina.pl'}`;

  await sendTextMessage(phone, menuMessage);
}

async function sendReservationInfo(phone: string, businessId: string): Promise<void> {
  const business = await BusinessModel.findById(businessId).lean();
  
  const message = `📅 *Make a Reservation*

We'd love to host you! Here's how to book:

📞 *Call us:* ${business?.phone || '+48 12 421 5555'}
💬 *WhatsApp:* Send your preferred date, time, and number of guests

📍 *Location:* ${business?.address || 'ul. Floriańska 15, Kraków'}

⏰ *Hours:*
• Mon-Thu: 12:00 - 22:00
• Fri-Sat: 12:00 - 23:00
• Sunday: 13:00 - 21:00

We also have a private dining room for events (up to 20 guests). Just ask! 🎉`;

  await sendTextMessage(phone, message);
}

async function sendLocationInfo(phone: string, businessId: string): Promise<void> {
  const business = await BusinessModel.findById(businessId).lean();
  
  const message = `📍 *La Cucina*

📍 Address: ${business?.address || 'ul. Floriańska 15, 33-332 Kraków, Poland'}

⏰ *Opening Hours:*
• Monday - Thursday: 12:00 - 22:00
• Friday - Saturday: 12:00 - 23:00
• Sunday: 13:00 - 21:00

📞 Phone: ${business?.phone || '+48 12 421 5555'}
🌐 Website: ${business?.website || 'lacucina.pl'}

We look forward to seeing you! 🇮🇹`;

  await sendTextWithUrl(phone, 'Open in Google Maps', 'https://maps.google.com/?q=La+Cucina+Krakow');
}

// ─── Campaign Message Sender ─────────────────────────────────────────────────

export interface CampaignMessage {
  to: string;
  template: 'empty_slot_filler' | 'dormant_winback' | 'seasonal_promo' | 'reservation_reminder' | 'general';
  variables?: Record<string, string>;
}

/**
 * Template configurations for Meta WhatsApp Business
 * Note: Templates must be pre-approved in Meta Business Console
 * 
 * Template names should match what's registered in Meta:
 * - hello_world (Meta default - works for testing)
 * - empty_slot_filler (custom - must approve)
 * - dormant_winback (custom - must approve)
 * - seasonal_promo (custom - must approve)
 * - reservation_reminder (custom - must approve)
 */

const TEMPLATE_CONFIG: Record<string, { name: string; template: string }> = {
  empty_slot_filler: {
    name: 'empty_slot_filler',
    template: 'empty_slot_filler',
  },
  dormant_winback: {
    name: 'dormant_winback',
    template: 'dormant_winback',
  },
  seasonal_promo: {
    name: 'seasonal_promo',
    template: 'seasonal_promo',
  },
  reservation_reminder: {
    name: 'reservation_reminder',
    template: 'reservation_reminder',
  },
  general: {
    name: 'hello_world',  // Fall back to approved template
    template: 'hello_world',
  },
};

// For demo/testing - use hello_world template
const DEMO_TEMPLATE = 'hello_world';

/**
 * Send campaign message to a recipient
 * Uses template messages which work regardless of 24-hour window
 */
export async function sendCampaignMessage(
  recipient: string,
  template: string,
  variables?: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Get template configuration
  const config = TEMPLATE_CONFIG[template] || TEMPLATE_CONFIG.general;
  
  // For hello_world template, don't send parameters
  // For other templates, build components for template variables
  let components: any[] = [];
  const templateName = DEMO_TEMPLATE; // hello_world for now
  
  if (templateName === 'hello_world' || !variables || Object.keys(variables).length === 0) {
    // hello_world doesn't take parameters
    return sendTemplateMessage(recipient, templateName, 'en_US', []);
  }
  
  // Build components for template variables
  // Header component (for first variable like season name)
  const headerVar = variables.header;
  if (headerVar) {
    components.push({
      type: 'header',
      parameters: [{ type: 'text', text: headerVar }],
    });
  }
  
  // Body component (for body variables)
  const bodyValues = Object.entries(variables)
    .filter(([key]) => key !== 'header')
    .map(([_, value]) => value as string);
  
  if (bodyValues.length > 0) {
    components.push({
      type: 'body',
      parameters: bodyValues.map(v => ({ type: 'text', text: v })),
    });
  }
  
  return sendTemplateMessage(recipient, templateName, 'en_US', components);
}

/**
 * Send bulk campaign messages
 */
export async function sendBulkCampaign(
  recipients: string[],
  template: string,
  variables?: Record<string, string>,
  onProgress?: (sent: number, failed: number) => void
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    
    try {
      const result = await sendCampaignMessage(recipient, template, variables);
      
      if (result.success) {
        sent++;
      } else {
        failed++;
        errors.push(`${recipient}: ${result.error}`);
      }
    } catch (error) {
      failed++;
      errors.push(`${recipient}: ${(error as Error).message}`);
    }

    // Rate limiting - wait between messages (1 second)
    if (i < recipients.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Progress callback
    onProgress?.(sent, failed);
  }

  return { sent, failed, errors };
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function detectTopic(text: string): string {
  const lower = text.toLowerCase();
  
  if (lower.includes('menu') || lower.includes('karta') || lower.includes('jedzenie')) return 'menu';
  if (lower.includes('rezerw') || lower.includes('book') || lower.includes('stolik')) return 'reservations';
  if (lower.includes('godz') || lower.includes('hours') || lower.includes('open')) return 'hours';
  if (lower.includes('lokalizacja') || lower.includes('address') || lower.includes(' gdzie')) return 'location';
  if (lower.includes('cena') || lower.includes('price') || lower.includes('koszt')) return 'pricing';
  if (lower.includes('wino') || lower.includes('wine') || lower.includes('drink')) return 'drinks';
  if (lower.includes('evening') || lower.includes('event') || lower.includes('prywatn')) return 'events';
  
  return 'general';
}

/**
 * Clear session for a phone number
 */
export function clearSession(phone: string): void {
  sessions.delete(normalizePhone(phone));
}

/**
 * Get session info
 */
export function getSession(phone: string): { businessId: string; lastMessage?: string; context?: any } | undefined {
  return sessions.get(normalizePhone(phone));
}