import { Router, Request, Response, NextFunction } from 'express';
import { LeadModel } from '../db/models/Lead.js';
import { CampaignModel } from '../db/models/Campaign.js';
import { OpportunityModel } from '../db/models/Opportunity.js';
import { AgentRunModel } from '../db/models/AgentRun.js';
import { verifyJWT } from '../auth/middleware.js';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Returns dashboard statistics derived from entities
 */
router.get('/stats', verifyJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = (req as any).user.businessId;
    
    // Get leads stats
    const allLeads = await LeadModel.find({ business_id: businessId }).lean();
    const activeLeads = allLeads.filter(l => 
      ['new', 'contacted', 'qualified'].includes(l.status || '')
    ).length;
    const wonLeads = allLeads.filter(l => l.status === 'won');
    const totalLeadValue = wonLeads.reduce((sum, l) => sum + (l.value_estimate || 0), 0);
    
    // Get campaigns stats
    const allCampaigns = await CampaignModel.find({ business_id: businessId }).lean();
    const activeCampaigns = allCampaigns.filter(c => c.status === 'active').length;
    const pendingCampaigns = allCampaigns.filter(c => c.status === 'pending_review').length;
    const totalRevenue = allCampaigns.reduce((sum, c) => sum + (c.revenue_attributed || 0), 0);
    const totalClicks = allCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
    const totalImpressions = allCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
    
    // Get opportunities stats
    const allOpportunities = await OpportunityModel.find({ business_id: businessId }).lean();
    const newOpportunities = allOpportunities.filter(o => o.status === 'new').length;
    const highUrgencyOpportunities = allOpportunities.filter(o => 
      ['high', 'critical'].includes(o.urgency || '')
    ).length;
    const actedOnOpportunities = allOpportunities.filter(o => o.status === 'acted_on').length;
    const avgImpact = allOpportunities.length > 0
      ? allOpportunities.reduce((sum, o) => sum + (o.impact_score || 0), 0) / allOpportunities.length
      : 0;
    
    // Get recent agent runs
    const recentAgentRuns = await AgentRunModel.find({ business_id: businessId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    res.json({
      leads: {
        total: allLeads.length,
        active: activeLeads,
        won: wonLeads.length,
        totalValue: totalLeadValue,
      },
      campaigns: {
        total: allCampaigns.length,
        active: activeCampaigns,
        pending: pendingCampaigns,
        revenue: totalRevenue,
        clicks: totalClicks,
        impressions: totalImpressions,
      },
      opportunities: {
        total: allOpportunities.length,
        new: newOpportunities,
        highUrgency: highUrgencyOpportunities,
        actedOn: actedOnOpportunities,
        avgImpact: Math.round(avgImpact * 10) / 10,
      },
      agentRuns: recentAgentRuns.map(run => ({
        id: run._id,
        agent_type: run.agent_type,
        status: run.status,
        output_summary: run.output_summary,
        createdAt: run.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
