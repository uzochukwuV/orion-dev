/**
 * WhatsApp Cloud API Client
 * 
 * Sends outbound messages via Meta WhatsApp Business Platform.
 * Handles both direct messages and campaign broadcasts.
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

export interface SendMessageOptions {
  to: string;  // Phone number with country code
  body: string;
  previewUrl?: boolean;
}

export interface SendTemplateOptions {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
}

export interface SendImageOptions {
  to: string;
  imageUrl?: string;  // URL of hosted image
  imageId?: string;    // Meta media ID
  caption?: string;
}

// ─── Message Types ─────────────────────────────────────────────────────────────

type MessageBody = 
  | { type: 'text'; text: string }
  | { type: 'image'; image: { link?: string; id?: string; caption?: string } }
  | { type: 'template'; template: { name: string; language: { code: string }; components?: any[] } };

// ─── Core Send Function ───────────────────────────────────────────────────────

async function sendRequest(body: any): Promise<{ message_id?: string; error?: string }> {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    return { error: 'WhatsApp not configured - missing PHONE_NUMBER_ID or ACCESS_TOKEN' };
  }

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp API] Error:', data);
      return { error: data.error?.message || 'API request failed' };
    }

    return { message_id: data.messages?.[0]?.id };
  } catch (error) {
    console.error('[WhatsApp API] Request failed:', error);
    return { error: (error as Error).message };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send a simple text message
 */
export async function sendTextMessage(to: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!text) {
    return { success: false, error: 'Text is required' };
  }

  // Format phone number - remove +, spaces, and any non-digit characters
  const formattedPhone = to.replace(/[^0-9]/g, '');

  const payload = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'text',
    text: {
      preview_url: false,
      body: text.substring(0, 4096),
    },
  };

  const result = await sendRequest(payload);

  if (result.message_id) {
    return { success: true, messageId: result.message_id };
  }
  return { success: false, error: result.error };
}

/**
 * Send a text message with a clickable URL preview
 */
export async function sendTextWithUrl(to: string, text: string, url: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const payload = {
    messaging_product: 'whatsapp',
    to: to.replace(/[^0-9]/g, ''),
    type: 'text',
    text: {
      preview_url: true,
      body: `${text}\n\n${url}`,
    },
  };

  const result = await sendRequest(payload);

  if (result.message_id) {
    return { success: true, messageId: result.message_id };
  }
  return { success: false, error: result.error };
}

/**
 * Send a template message (for campaigns)
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = 'en',
  components?: any[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const payload = {
    messaging_product: 'whatsapp',
    to: to.replace(/[^0-9]/g, ''),
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      components: components || [],
    },
  };

  const result = await sendRequest(payload);

  if (result.message_id) {
    return { success: true, messageId: result.message_id };
  }
  return { success: false, error: result.error };
}

/**
 * Send an image message
 */
export async function sendImageMessage(
  to: string,
  imageUrl?: string,
  imageId?: string,
  caption?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!imageUrl && !imageId) {
    return { success: false, error: 'Either imageUrl or imageId is required' };
  }

  const imagePayload: any = imageUrl 
    ? { link: imageUrl }
    : { id: imageId };

  if (caption) {
    imagePayload.caption = caption;
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: to.replace(/[^0-9]/g, ''),
    type: 'image',
    image: imagePayload,
  };

  const result = await sendRequest(payload);

  if (result.message_id) {
    return { success: true, messageId: result.message_id };
  }
  return { success: false, error: result.error };
}

/**
 * Mark message as read
 */
export async function markAsRead(messageId: string): Promise<boolean> {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) return false;

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[WhatsApp] Failed to mark message as read:', error);
    return false;
  }
}

/**
 * Get message status (delivered, read, etc.)
 */
export async function getMessageStatus(messageId: string): Promise<string | null> {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) return null;

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${messageId}`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.status || null;
  } catch {
    return null;
  }
}

// ─── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Check if WhatsApp is configured
 */
export function isConfigured(): boolean {
  return !!(PHONE_NUMBER_ID && ACCESS_TOKEN);
}