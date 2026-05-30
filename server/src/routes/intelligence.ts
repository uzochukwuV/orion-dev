/**
 * Intelligence API Routes — Market scan and research endpoints.
 *
 * Endpoints:
 *   POST /api/intelligence/scan   — Run market intelligence scan
 *   GET  /api/intelligence/status — Check scan status
 */

import { Router, Request, Response, NextFunction } from 'express';
import { runResearchAgent } from '../agents/index.js';
import { AgentRunModel } from '../db/models/AgentRun.js';
import { BusinessModel } from '../db/models/Business.js';
import { verifyJWT } from '../auth/middleware.js';

export function createIntelligenceRoutes(): Router {
  const router = Router();

  // ─── POST /api/intelligence/scan ────────────────────────────────────────────

  /**
   * Run a market intelligence scan for a business.
   *
   * Fetches live web data via Bright Data tools, identifies opportunities,
   * and saves findings as Opportunity documents.
   *
   * Body:
   *   {
   *     business_id?: string,        // Default: 'demo'
   *     focus?: string               // Optional focus (e.g., "competitors", "market_trends")
   *     competitors?: string[]       // Optional list of competitor names
   *   }
   *
   * Response:
   *   {
   *     agentRunId: string,
   *     business_id: string,
   *     scan_type: 'market_intelligence',
   *     opportunities: [
   *       {
   *         title: string,
   *         description: string,
   *         category: string,
   *         urgency: 'low' | 'medium' | 'high',
   *         impact_score: number,
   *         source: string,
   *         suggested_action: string
   *       }
   *     ],
   *     summary: string,
   *     data_freshness: string,
   *     created_at: ISO8601
   *   }
   *
   * Example:
   *   curl -X POST http://localhost:3001/api/intelligence/scan \
   *     -H "Content-Type: application/json" \
   *     -d '{"business_id":"demo","focus":"market_trends"}'
   */
  router.post('/scan', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get business_id from authenticated user or request body
      const user = req.user as any;
      let { business_id, focus = 'general', competitors = [] } = req.body;
      
      if (!business_id && user?.businessId) {
        business_id = user.businessId;
      }
      
      if (!business_id) {
        return res.status(400).json({ error: 'business_id is required' });
      }

      // Fetch business for context
      const business = await BusinessModel.findById(business_id).lean();

      if (!business) {
        return res.status(404).json({ error: `Business ${business_id} not found` });
      }

      // Build scan task
      const scanTask = buildScanTask(focus, business, competitors);

      console.log(`[Intelligence] Starting scan for ${business_id}: ${focus}`);

      // Create AgentRun document
      const agentRun = await AgentRunModel.create({
        business_id,
        agent_type: 'market_intelligence',
        trigger: 'manual',
        status: 'running',
        input_summary: scanTask,
      });

      try {
        // Run research agent
        const result = await runResearchAgent({
          task: scanTask,
          businessContext: {
            business_id,
            name: business.name,
            type: business.type,
            city: business.city,
            competitors,
          },
          onStep: (step) => {
            console.log(`[Intelligence] ${step.agent}: ${step.action}`);
          },
        });

        // Update AgentRun with results
        agentRun.status = 'completed';
        agentRun.output_summary = result.summary;
        await agentRun.save();

        res.json({
          agentRunId: agentRun._id.toString(),
          business_id,
          scan_type: 'market_intelligence',
          opportunities: result.findings,
          summary: result.summary,
          data_freshness: result.data_freshness,
          created_at: agentRun.createdAt,
        });
      } catch (error) {
        // Update AgentRun with error
        agentRun.status = 'failed';
        agentRun.error_message = (error as Error).message;
        await agentRun.save();

        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  // ─── GET /api/intelligence/status ───────────────────────────────────────────

  /**
   * Check the status of a market intelligence scan.
   *
   * Query:
   *   agent_run_id?: string       // Get specific scan status
   *   business_id?: string        // List all scans for business
   *   limit?: number              // Default: 10
   *
   * Response:
   *   {
   *     agentRunId: string,
   *     status: 'running' | 'completed' | 'failed',
   *     created_at: ISO8601,
   *     completed_at: ISO8601,
   *     opportunities_found?: number,
   *     error_message?: string
   *   }
   *   OR
   *   [...]  // Array if business_id provided
   *
   * Example:
   *   curl "http://localhost:3001/api/intelligence/status?agent_run_id=507f1f77bcf86cd799439011"
   */
  router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { agent_run_id, business_id, limit = 10 } = req.query;

      if (agent_run_id) {
        // Fetch specific scan
        const run = await AgentRunModel.findById(agent_run_id).lean();

        if (!run) {
          return res.status(404).json({ error: `AgentRun ${agent_run_id} not found` });
        }

        return res.json({
          agentRunId: run._id?.toString(),
          status: run.status,
          created_at: (run as any).createdAt,
          opportunities_found: run.output_summary ? 1 : 0,
          error_message: run.error_message,
        });
      }

      if (business_id) {
        // List scans for business
        const runs = await AgentRunModel.find({
          business_id: business_id as string,
          agent_type: 'market_intelligence',
        })
          .sort({ createdAt: -1 })
          .limit(Number(limit))
          .lean();

        return res.json(
          runs.map((run: any) => ({
            agentRunId: run._id?.toString(),
            status: run.status,
            created_at: run.createdAt,
            opportunities_found: run.output_summary ? 1 : 0,
          }))
        );
      }

      res.status(400).json({ error: 'Provide agent_run_id or business_id' });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Build a scan task based on focus area.
 */
function buildScanTask(
  focus: string,
  business: any,
  competitors: string[]
): string {
  const businessInfo = `Business: ${business.name} (${business.type})`;
  const competitorInfo = competitors.length > 0 
    ? ` Competitors: ${competitors.join(', ')}.`
    : '';

  switch (focus) {
    case 'competitors':
      return `${businessInfo}.${competitorInfo} Analyze competitor strategies, marketing approaches, and recent activities.`;

    case 'market_trends':
      return `${businessInfo}. Identify current market trends, emerging technologies, and industry shifts relevant to ${business.type} businesses.`;

    case 'customer_insights':
      return `${businessInfo}. Find customer pain points, unmet needs, and buying behavior patterns in the ${business.type} industry.`;

    case 'opportunities':
      return `${businessInfo}. Identify business growth opportunities, expansion areas, and untapped markets.`;

    default:
      return `${businessInfo}.${competitorInfo} Conduct comprehensive market intelligence scan. Find opportunities, threats, trends, and competitive landscape insights.`;
  }
}

export default createIntelligenceRoutes;
