/**
 * WhatsApp Integration Module
 * 
 * Exports all WhatsApp-related functionality:
 * - webhookHandler: Webhook verification and message parsing
 * - client: WhatsApp Cloud API client
 * - messageRouter: AI message routing
 * - routes: Express routes
 */

export * from './webhookHandler.js';
export * from './client.js';
export * from './messageRouter.js';
export { default as whatsappRoutes } from './routes.js';