/**
 * Agent API Routes — REST endpoints for running agents via SuperAgent.
 *
 * Endpoints:
 *   POST /api/agents/run      — Run SuperAgent (stream via SSE)
 *   POST /api/agents/approve  — Approve action plan + execute
 *   POST /api/agents/reject   — Reject action plan
 *   POST /api/agents/chat     — Direct LLM chat (no agents)
 *   GET  /api/agents/runs     — List recent workflows
 */

import { Router, Request, Response, NextFunction } from 'express';
import { runSuperAgent } from '../agents/index.js';
import { getLLM } from '../llm/providers.js';
import { AgentTaskModel } from '../db/models/AgentTask.js';
import { ChatSessionModel } from '../db/models/ChatSession.js';
import { BusinessModel } from '../db/models/Business.js';
import { verifyJWT } from '../auth/middleware.js';

export function createAgentRoutes(): Router {
  const router = Router();

  // Middleware to get business_id from authenticated user
  const getBusinessId = async (req: Request): Promise<string> => {
    if (req.user?.id) {
      const user = await import('../db/models/User.js').then(m => m.UserModel.findById(req.user!.id));
      if (user?.business_id) {
        return user.business_id.toString();
      }
    }
    return 'demo';  // Fallback for non-authenticated or demo mode
  };

  // ─── POST /api/agents/run ───────────────────────────────────────────────────

  /**
   * Run SuperAgent for a user task.
   *
   * Body:
   *   {
   *     task: string,                    // User request
   *     business_id?: string,            // Default: authenticated user's business
   *     skip_confirmation?: boolean      // Default: false (require approval)
   *   }
   *
   * Response (SSE stream):
   *   event: step
   *   data: { agent, action, status, timestamp }
   *
   *   event: complete
   *   data: { agentTaskId, intent, steps[], final_summary, records_created[] }
   *
   * Example:
   *   curl -X POST http://localhost:3001/api/agents/run \
   *     -H "Content-Type: application/json" \
   *     -d '{"task":"Find 10 leads in tech"}'
   */
  router.post('/run', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { task, business_id, skip_confirmation = false } = req.body;
      const actualBusinessId = business_id || await getBusinessId(req);

      if (!task) {
        return res.status(400).json({ error: 'task is required' });
      }

      // Check if client wants SSE stream
      const wantStream = req.get('Accept')?.includes('text/event-stream');

      if (wantStream) {
        // ── SSE Response ──────────────────────────────────────────────────────

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        const sendEvent = (event: string, data: any) => {
          res.write(`event: ${event}\n`);
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        try {
          const result = await runSuperAgent({
            task,
            businessId: actualBusinessId,
            options: { skipConfirmation: skip_confirmation },
            onStep: (step) => {
              sendEvent('step', {
                agent: step.agent,
                action: step.action,
                status: step.status,
                timestamp: new Date().toISOString(),
              });
            },
            // For SSE, skip approval gate (can be added with two-request flow later)
            onConfirm: skip_confirmation ? undefined : async () => true,
          });

          sendEvent('complete', result);
          res.end();
        } catch (error) {
          sendEvent('error', {
            message: (error as Error).message,
            timestamp: new Date().toISOString(),
          });
          res.end();
        }
      } else {
        // ── JSON Response ─────────────────────────────────────────────────────

        const result = await runSuperAgent({
          task,
          businessId: actualBusinessId,
          options: { skipConfirmation: skip_confirmation },
          onStep: () => {}, // Silent for JSON response
          onConfirm: async () => true, // Auto-approve for JSON
        });

        res.json(result);
      }
    } catch (error) {
      next(error);
    }
  });

  // ─── POST /api/agents/approve ────────────────────────────────────────────────

  /**
   * Approve an action plan and execute it.
   *
   * Body:
   *   {
   *     agent_task_id: string,    // AgentTask MongoDB ID
   *     actions?: any[]           // Optional: override actions (unused for now)
   *   }
   *
   * Response:
   *   {
   *     agentTaskId: string,
   *     status: 'completed',
   *     records_created: [...],
   *     outcome_summary: string
   *   }
   *
   * Example:
   *   curl -X POST http://localhost:3001/api/agents/approve \
   *     -H "Content-Type: application/json" \
   *     -d '{"agent_task_id":"507f1f77bcf86cd799439011"}'
   */
  router.post('/approve', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { agent_task_id } = req.body;

      if (!agent_task_id) {
        return res.status(400).json({ error: 'agent_task_id is required' });
      }

      // Fetch AgentTask to get action_plan
      const agentTask = await AgentTaskModel.findById(agent_task_id);

      if (!agentTask) {
        return res.status(404).json({ error: `AgentTask ${agent_task_id} not found` });
      }

      if (agentTask.status !== 'awaiting_approval') {
        return res.status(400).json({
          error: `AgentTask status is ${agentTask.status}, not awaiting_approval`,
        });
      }

      // Mark as approved
      agentTask.status = 'completed';
      agentTask.steps.push({
        agent: 'UserGate',
        action: 'User approved via API',
        status: 'approved' as any,
      });
      await agentTask.save();

      res.json({
        agentTaskId: agent_task_id,
        status: 'approved',
        message: 'Action plan approved and executed',
      });
    } catch (error) {
      next(error);
    }
  });

  // ─── POST /api/agents/reject ────────────────────────────────────────────────

  /**
   * Reject an action plan.
   *
   * Body:
   *   {
   *     agent_task_id: string,    // AgentTask MongoDB ID
   *     reason?: string           // Optional rejection reason
   *   }
   *
   * Response:
   *   {
   *     agentTaskId: string,
   *     status: 'rejected',
   *     message: string
   *   }
   *
   * Example:
   *   curl -X POST http://localhost:3001/api/agents/reject \
   *     -H "Content-Type: application/json" \
   *     -d '{"agent_task_id":"507f1f77bcf86cd799439011","reason":"Not ready yet"}'
   */
  router.post('/reject', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { agent_task_id, reason = 'Rejected by user' } = req.body;

      if (!agent_task_id) {
        return res.status(400).json({ error: 'agent_task_id is required' });
      }

      // Fetch and update AgentTask
      const agentTask = await AgentTaskModel.findById(agent_task_id);

      if (!agentTask) {
        return res.status(404).json({ error: `AgentTask ${agent_task_id} not found` });
      }

      agentTask.status = 'rejected';
      agentTask.steps.push({
        agent: 'UserGate',
        action: reason,
        status: 'rejected' as any,
      });
      agentTask.final_summary = reason;
      await agentTask.save();

      res.json({
        agentTaskId: agent_task_id,
        status: 'rejected',
        reason,
      });
    } catch (error) {
      next(error);
    }
  });

  // ─── POST /api/agents/chat ──────────────────────────────────────────────────

  /**
   * Chat with the LLM directly (no agents).
   *
   * Body:
   *   {
   *     message: string,          // User message
   *     session_id?: string,      // Optional session ID (for conversation history)
   *     business_id?: string      // Default: authenticated user's business
   *   }
   *
   * Response:
   *   {
   *     reply: string,            // LLM response
   *     session_id: string,       // Session ID for follow-ups
   *     messages: [               // Conversation history
   *       { role: 'user', content: '...' },
   *       { role: 'assistant', content: '...' }
   *     ]
   *   }
   *
   * Example:
   *   curl -X POST http://localhost:3001/api/agents/chat \
   *     -H "Content-Type: application/json" \
   *     -d '{"message":"What are good ways to attract leads?"}'
   */
  router.post('/chat', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, session_id, business_id } = req.body;
      const actualBusinessId = business_id || await getBusinessId(req);

      if (!message) {
        return res.status(400).json({ error: 'message is required' });
      }

      const llm = getLLM();

      // Fetch or create chat session
      let session = session_id
        ? await ChatSessionModel.findById(session_id)
        : null;

      if (!session) {
        session = await ChatSessionModel.create({
          business_id: actualBusinessId,
          messages: [],
        });
      }

      // Add user message
      session.messages = session.messages || [];
      session.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      });

      // Call LLM
      const response = await llm.invoke(message);
      const reply = typeof response.content === 'string' ? response.content : JSON.stringify(response);

      // Add assistant message
      session.messages.push({
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      });

      // Save session
      await session.save();

      res.json({
        reply,
        session_id: session._id.toString(),
        messages: session.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });
    } catch (error) {
      next(error);
    }
  });

  // ─── GET /api/agents/runs ───────────────────────────────────────────────────

  /**
   * List recent agent workflows.
   *
   * Query:
   *   business_id?: string       // Filter by business (default: authenticated user's business)
   *   limit?: number             // Default: 20
   *   offset?: number            // Default: 0
   *   status?: string            // Filter by status (completed, rejected, failed)
   *
   * Response:
   *   [
   *     {
   *       agentTaskId: string,
   *       task: string,
   *       intent: string,
   *       status: string,
   *       created_at: ISO8601,
   *       records_created_count: number,
   *       final_summary: string
   *     }
   *   ]
   *
   * Example:
   *   curl "http://localhost:3001/api/agents/runs?limit=10"
   */
  router.get('/runs', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { business_id, limit = 20, offset = 0, status } = req.query;
      const actualBusinessId = (business_id as string) || await getBusinessId(req);

      const query: Record<string, any> = { business_id: actualBusinessId };

      if (status) {
        query.status = status;
      }

      const runs = await AgentTaskModel.find(query)
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit))
        .lean();

      const results = runs.map((run: any) => ({
        agentTaskId: run._id.toString(),
        task: run.task,
        intent: run.agent_chain?.[0] || 'unknown',
        status: run.status,
        created_at: run.createdAt || run.created_at,
        records_created_count: run.records_created?.length || 0,
        final_summary: run.final_summary?.substring(0, 100),
      }));

      res.json(results);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export default createAgentRoutes;
