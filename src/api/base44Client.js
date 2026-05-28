/**
 * Compatibility shim — re-exports the new typed API so that all existing
 * page imports (`import { base44 } from '@/api/base44Client'`) keep working
 * without any changes.
 *
 * The original base44 SDK is no longer used; all calls now go to the
 * Orion Node.js backend at VITE_API_URL (default: http://localhost:3001).
 */

import { entities } from './entities';
import { apiPost } from './client';

/**
 * Drop-in replacement for the base44 SDK object.
 *
 * Supported surface:
 *   base44.entities.*          — CRUD for all entity types
 *   base44.integrations.Core.InvokeLLM({ prompt }) — proxied to /api/agents/chat
 */
export const base44 = {
  entities,

  integrations: {
    Core: {
      /**
       * Proxy for base44.integrations.Core.InvokeLLM.
       * Sends the prompt to the backend chat endpoint and returns the reply string.
       *
       * @param {{ prompt: string, add_context_from_internet?: boolean }} options
       * @returns {Promise<string>}
       */
      InvokeLLM: async ({ prompt }) => {
        const res = /** @type {any} */ (await apiPost('/api/agents/chat', {
          message: prompt,
          business_id: 'demo',
        }));
        return res?.reply ?? res ?? '';
      },
    },
  },
};
