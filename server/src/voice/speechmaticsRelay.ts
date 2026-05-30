/**
 * Speechmatics Real-Time Voice WebSocket Relay
 *
 * Bridges browser WebSocket clients to Speechmatics real-time ASR service.
 * Handles:
 *   - Audio stream ingestion from browser
 *   - Transcript streaming back to browser
 *   - Agent response generation (SuperAgent loop-back)
 *   - Optional TTS synthesis
 *
 * Setup:
 *   1. Call setupVoiceWebSocket(httpServer) after server.listen()
 *   2. Browser connects to: ws://localhost:3001/ws/voice
 *   3. Send audio blobs as binary frames
 *   4. Receive transcripts as JSON messages
 *
 * Requires:
 *   - @speechmatics/real-time-client npm package
 *   - SPEECHMATICS_API_KEY in .env
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
// Speechmatics client - use any since package has no types
const RealtimeClientType: any = null;


// ─── Types ──────────────────────────────────────────────────────────────────

interface VoiceClientState {
  speechmaticsClient: RealtimeClientType | null;
  isConnected: boolean;
  sessionId: string;
  businessId: string;
  fullTranscript: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface TranscriptMessage {
  type: 'transcript' | 'partial' | 'final' | 'error' | 'connected' | 'agent_response';
  text?: string;
  isFinal?: boolean;
  confidence?: number;
  error?: string;
  timestamp?: string;
  audioUrl?: string;  // Optional TTS audio URL
}

// ─── Agent Import ─────────────────────────────────────────────────────────────
// Lazy import to avoid circular dependencies
let runSuperAgent: any = null;

async function getSuperAgent() {
  if (!runSuperAgent) {
    const module = await import('../agents/superAgent.js');
    runSuperAgent = module.runSuperAgent;
  }
  return runSuperAgent;
}

// ─── Setup Voice WebSocket ───────────────────────────────────────────────────

/**
 * Attach voice WebSocket relay to HTTP server.
 * Call after server.listen().
 *
 * @param httpServer   HTTP server instance
 * @param options      { path?: '/ws/voice', apiKey?: process.env.SPEECHMATICS_API_KEY }
 */
export function setupVoiceWebSocket(
  httpServer: HTTPServer,
  options: { path?: string; apiKey?: string } = {}
): WebSocketServer {
  const path = options.path || '/ws/voice';
  const apiKey = options.apiKey || process.env.SPEECHMATICS_API_KEY;

  if (!apiKey) {
    console.warn('[Voice] SPEECHMATICS_API_KEY not set — voice features disabled');
    return new WebSocketServer({ noServer: true });
  }

  const wss = new WebSocketServer({ server: httpServer, path });

  wss.on('connection', async (ws: WebSocket, req: any) => {
    const clientId = Math.random().toString(36).substring(7);
    const sessionId = req.url?.split('?session=')[1] || clientId;
    const businessId = req.url?.split('&business=')[1] || req.url?.split('?business=')[1] || 'demo';

    console.log(`[Voice] Client connected: ${clientId} (session=${sessionId}, business=${businessId})`);

    const clientState: VoiceClientState = {
      speechmaticsClient: null,
      isConnected: false,
      sessionId,
      businessId,
      fullTranscript: '',
      conversationHistory: [],
    };

    // Handle WebSocket messages from browser
    ws.on('message', async (message: Buffer | string) => {
      try {
        // Handle text messages (control messages)
        if (typeof message === 'string') {
          const data = JSON.parse(message);
          if (data.type === 'end') {
            // End of audio stream — trigger agent response
            if (clientState.fullTranscript && clientState.speechmaticsClient) {
              clientState.speechmaticsClient.stop();
            }
            return;
          }
          if (data.type === 'get_ai_response') {
            // Explicitly request AI response for current transcript
            await handleAgentResponse(ws, clientState);
            return;
          }
        }

        // Binary message — audio data
        if (!clientState.speechmaticsClient && !clientState.isConnected) {
          // First message: initialize Speechmatics connection
          await initSpeechmaticsClient(clientState, ws, apiKey!);
        }

        if (clientState.speechmaticsClient && clientState.isConnected) {
          // Forward audio to Speechmatics
          clientState.speechmaticsClient.send(message);
        }
      } catch (error) {
        console.error(`[Voice] Message error: ${(error as Error).message}`);
        sendTranscript(ws, {
          type: 'error',
          error: (error as Error).message,
        });
      }
    });

    // Handle WebSocket close
    ws.on('close', async () => {
      console.log(`[Voice] Client disconnected: ${clientId}`);

      if (clientState.speechmaticsClient) {
        try {
          clientState.speechmaticsClient.stop();
        } catch (error) {
          console.error(`[Voice] Error stopping Speechmatics: ${(error as Error).message}`);
        }
      }
    });

    // Handle WebSocket errors
    ws.on('error', (error) => {
      console.error(`[Voice] WebSocket error: ${error.message}`);
    });
  });

  console.log(`[Voice] WebSocket relay listening at ${path}`);
  return wss;
}

// ─── Agent Response Handler ──────────────────────────────────────────────────

/**
 * Handle agent response generation from voice transcript.
 * This creates the loop-back: voice → transcript → SuperAgent → response → TTS
 */
async function handleAgentResponse(ws: WebSocket, clientState: VoiceClientState): Promise<void> {
  if (!clientState.fullTranscript.trim()) {
    return;
  }

  console.log(`[Voice] Processing transcript: "${clientState.fullTranscript.substring(0, 50)}..."`);

  try {
    const superAgent = await getSuperAgent();

    // Add user message to conversation history
    clientState.conversationHistory.push({
      role: 'user',
      content: clientState.fullTranscript,
    });

    // Run SuperAgent with the voice transcript as the task
    const result = await superAgent({
      task: clientState.fullTranscript,
      businessId: clientState.businessId,
      options: { skipConfirmation: true }, // Voice should be fast, skip approval gates
    });

    const agentResponse = result.final_summary || 'I processed your request.';

    // Add assistant response to conversation history
    clientState.conversationHistory.push({
      role: 'assistant',
      content: agentResponse,
    });

    // Send response back to browser
    sendTranscript(ws, {
      type: 'agent_response',
      text: agentResponse,
      isFinal: true,
    });

    console.log(`[Voice] Agent responded: "${agentResponse.substring(0, 50)}..."`);
  } catch (error) {
    console.error(`[Voice] Agent error: ${(error as Error).message}`);
    sendTranscript(ws, {
      type: 'error',
      error: `Agent processing failed: ${(error as Error).message}`,
    });
  }
}

// ─── Speechmatics Client Initialization ──────────────────────────────────────

/**
 * Initialize Speechmatics real-time ASR client for a browser connection.
 */
async function initSpeechmaticsClient(
  clientState: VoiceClientState,
  ws: WebSocket,
  apiKey: string
): Promise<void> {
  const client = new RealtimeClientType({
    apiKey,
    ssl: true,
  });

  clientState.speechmaticsClient = client;

  // Handle Speechmatics events
  client.on('error', (error: any) => {
    console.error(`[Voice] Speechmatics error: ${error.message}`);
    sendTranscript(ws, {
      type: 'error',
      error: error.message,
    });
  });

  client.on('end', () => {
    console.log(`[Voice] Speechmatics session ended: ${clientState.sessionId}`);
    
    // Trigger agent response when stream ends
    if (clientState.fullTranscript) {
      // Use setImmediate to avoid blocking
      setImmediate(() => handleAgentResponse(ws, clientState));
    }

    sendTranscript(ws, {
      type: 'final',
      text: clientState.fullTranscript,
      isFinal: true,
    });
  });

  // Listen for transcription events
  client.on('AddTranscript', (event: any) => {
    // Final transcript (after end of speech segment)
    const text = event.transcript?.[0]?.alternatives?.[0]?.content || '';

    if (text) {
      clientState.fullTranscript = text;
      sendTranscript(ws, {
        type: 'transcript',
        text,
        isFinal: true,
        confidence: event.transcript?.[0]?.confidence_score || 0.8,
      });
    }
  });

  client.on('AddPartialTranscript', (event: any) => {
    // Partial transcript (mid-utterance)
    const text = event.transcript?.map((t: any) => t.alternatives?.[0]?.content).join(' ') || '';

    if (text) {
      sendTranscript(ws, {
        type: 'partial',
        text,
        isFinal: false,
      });
    }
  });

  // Start Speechmatics session
  try {
    await client.start({
      transcription_config: {
        language: 'en',
        enable_partials: true,
        max_delay: 2.0,
        punctuation_overrides: { permitted_marks: ['.', ',', '?', '!', ';', ':'] },
      },
    });

    clientState.isConnected = true;

    sendTranscript(ws, {
      type: 'connected',
      text: 'Voice connection established',
    });

    console.log(`[Voice] Speechmatics session started: ${clientState.sessionId}`);
  } catch (error) {
    console.error(`[Voice] Failed to start Speechmatics: ${(error as Error).message}`);
    sendTranscript(ws, {
      type: 'error',
      error: `Failed to connect: ${(error as Error).message}`,
    });
  }
}

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Send transcript message to browser client.
 */
function sendTranscript(ws: WebSocket, message: TranscriptMessage): void {
  try {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  } catch (error) {
    console.error(`[Voice] Send error: ${(error as Error).message}`);
  }
}

export default setupVoiceWebSocket;
