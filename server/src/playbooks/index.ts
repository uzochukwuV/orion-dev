/**
 * Playbook Engine — Vertical-specific AI prompts and intelligence.
 *
 * Provides vertical-specific context, scan targets, opportunities,
 * and campaign templates for each agent.
 *
 * Usage:
 *   import { getPlaybook, getPlaybookScanTargets } from './index.js';
 *   const playbook = getPlaybook('salon');
 *   const scanTargets = getPlaybookScanTargets(playbook, { city: 'Warsaw' });
 */

// ─── Vertical Types ────────────────────────────────────────────────────────────

export type Vertical =
  | 'salon'
  | 'gym'
  | 'restaurant'
  | 'clinic'
  | 'law'
  | 'realestate'
  | 'hotel'
  | 'ecommerce'
  | 'agency'
  | 'autorepair';

// ─── Playbook Structure ────────────────────────────────────────────────────────

export interface PlaybookScanTarget {
  id: string;
  query: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'competitor' | 'market' | 'trend' | 'customer' | 'seasonal';
}

export interface PlaybookTrigger {
  id: string;
  name: string;
  condition: string;
  description: string;
}

export interface PlaybookAction {
  id: string;
  name: string;
  channel: 'whatsapp' | 'email' | 'instagram' | 'sms' | 'internal';
  template_type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface Playbook {
  vertical: Vertical;
  display_name: string;
  pain_points: string[];
  
  scan_targets: PlaybookScanTarget[];
  triggers: PlaybookTrigger[];
  actions: PlaybookAction[];
  
  intelligence_prompt: string;
  strategy_prompt: string;
  
  kpis: {
    primary: string[];
    secondary: string[];
  };
  
  // Campaign templates per vertical
  campaign_templates: Array<{
    name: string;
    trigger: string;
    channel: string;
    urgency: 'critical' | 'high' | 'medium' | 'low';
  }>;
}

// ─── Vertical Playbooks ────────────────────────────────────────────────────────

const salonPlaybook: Playbook = {
  vertical: 'salon',
  display_name: 'Salons & Beauty Studios',
  pain_points: [
    'Empty slots killing weekly revenue',
    'Clients go quiet after 2-3 visits, no re-engagement system',
    'No idea which promos actually filled chairs',
    'Social media is inconsistent or dead',
    "Can't track which staff member drives the most repeat business",
  ],
  
  scan_targets: [
    { id: 's1', query: 'competitor salon pricing {city}', priority: 'high', category: 'competitor' },
    { id: 's2', query: 'trending hair services {city} Instagram', priority: 'high', category: 'trend' },
    { id: 's3', query: 'local wedding season dates {city}', priority: 'critical', category: 'seasonal' },
    { id: 's4', query: 'Google reviews sentiment salons near {location}', priority: 'high', category: 'competitor' },
    { id: 's5', query: 'beauty studio promotions {city}', priority: 'medium', category: 'competitor' },
  ],
  
  triggers: [
    { id: 't1', name: 'Empty slot 48h', condition: 'appointment_slot_empty_48h', description: 'Slot has no bookings 48 hours out' },
    { id: 't2', name: 'Dormant client', condition: 'client_no_visit_60d', description: 'Client hasn\'t visited in 60+ days' },
    { id: 't3', name: 'Seasonal peak', condition: 'seasonal_peak_14d_before', description: '14 days before seasonal peak (weddings, holidays)' },
    { id: 't4', name: 'Staff underperformance', condition: 'staff_repeat_rate_below_40pct', description: 'Staff member repeat rate below 40%' },
  ],
  
  actions: [
    { id: 'a1', name: 'Empty slot filler', channel: 'whatsapp', template_type: 'empty_slot_filler', priority: 'high' },
    { id: 'a2', name: 'Dormant win-back', channel: 'whatsapp', template_type: 'dormant_client_offer', priority: 'high' },
    { id: 'a3', name: 'Seasonal promo blast', channel: 'instagram', template_type: 'seasonal_announcement', priority: 'critical' },
    { id: 'a4', name: 'Review request', channel: 'whatsapp', template_type: 'review_request', priority: 'medium' },
  ],
  
  intelligence_prompt: `You are a market intelligence expert specializing in beauty salons and beauty studios. Focus on:
- Competitor pricing for services (cuts, color, treatments)
- Trending services in the local market (balayage, brow lamination, etc.)
- Seasonal patterns (wedding season, prom season, holiday rush)
- Local events that drive beauty appointments
- Social media trends in the beauty space
- Review patterns for local salons (what clients complain about, praise)`,
  
  strategy_prompt: `You are a growth strategist for beauty salons. Prioritize:
- Filling empty appointment slots (highest ROI action)
- Re-engaging dormant clients who stopped visiting
- Staff performance optimization (who brings back clients)
- Promo effectiveness tracking (which offers fill chairs)
- Seasonal campaign timing for maximum impact`,
  
  kpis: {
    primary: ['appointments_filled', 'client_retention_rate', 'slot_utilization_pct'],
    secondary: ['review_score', 'repeat_visit_rate', 'avg_service_value'],
  },
  
  campaign_templates: [
    { name: 'Empty slot filler', trigger: 'slot_empty_48h', channel: 'whatsapp', urgency: 'high' },
    { name: 'Dormant win-back', trigger: 'no_visit_60d', channel: 'whatsapp', urgency: 'high' },
    { name: 'Wedding season promo', trigger: 'seasonal_peak_14d', channel: 'instagram', urgency: 'critical' },
  ],
};

const gymPlaybook: Playbook = {
  vertical: 'gym',
  display_name: 'Gyms & Fitness Studios',
  pain_points: [
    'January spike then February cliff — retention is the whole business',
    'Trial members never convert to paid',
    'Class schedules have dead hours nobody books',
    'Trainers leave and take clients with them',
    'Competing against apps like Freeletics that cost nothing',
  ],
  
  scan_targets: [
    { id: 'g1', query: 'local gym membership prices {city}', priority: 'high', category: 'competitor' },
    { id: 'g2', query: 'fitness class trends {city} 2024', priority: 'high', category: 'trend' },
    { id: 'g3', query: 'new fitness studios opened {city}', priority: 'high', category: 'competitor' },
    { id: 'g4', query: 'January gym signup patterns seasonal', priority: 'critical', category: 'seasonal' },
    { id: 'g5', query: 'fitness influencer collaborations local {city}', priority: 'medium', category: 'market' },
  ],
  
  triggers: [
    { id: 't1', name: 'Dropout risk', condition: 'member_no_checkin_14d', description: 'Member hasn\'t checked in for 14+ days' },
    { id: 't2', name: 'Trial expiring', condition: 'trial_member_7d_before_expiry', description: 'Trial member expires in 7 days' },
    { id: 't3', name: 'Dead class slot', condition: 'class_booking_below_50pct', description: 'Class has below 50% booking rate' },
    { id: 't4', name: 'January retention', condition: 'february_retention_check', description: 'February check-in for January signups' },
  ],
  
  actions: [
    { id: 'a1', name: 'Retention outreach', channel: 'whatsapp', template_type: 'retention_checkin', priority: 'critical' },
    { id: 'a2', name: 'Trial conversion offer', channel: 'whatsapp', template_type: 'trial_conversion_offer', priority: 'critical' },
    { id: 'a3', name: 'Dead class promo', channel: 'email', template_type: 'class_spillage_offer', priority: 'medium' },
    { id: 'a4', name: 'Challenge reminder', channel: 'whatsapp', template_type: 'fitness_challenge_reminder', priority: 'high' },
  ],
  
  intelligence_prompt: `You are a market intelligence expert for fitness studios and gyms. Focus on:
- Competitor pricing and membership tiers
- Emerging fitness trends (HIIT, boutique studios, CrossFit)
- Local corporate wellness partnerships
- Seasonal fitness patterns (New Year, summer body, post-holiday)
- Trainer reputation and retention strategies
- App competition analysis (Freeletics, Nike Training Club)`,
  
  strategy_prompt: `You are a growth strategist for fitness studios. Prioritize:
- Preventing member dropout before it happens (predictive retention)
- Converting trial members to paid (highest value conversion)
- Optimizing class schedules to eliminate dead hours
- Creating trainer loyalty programs
- Timing promotions for seasonal spikes`,
  
  kpis: {
    primary: ['member_retention_rate', 'trial_to_paid_conversion', 'class_booking_rate'],
    secondary: ['avg_membership_value', 'referral_rate', 'churn_rate_monthly'],
  },
  
  campaign_templates: [
    { name: 'Churn prevention', trigger: 'member_no_checkin_14d', channel: 'whatsapp', urgency: 'critical' },
    { name: 'Trial conversion', trigger: 'trial_expiring_7d', channel: 'whatsapp', urgency: 'critical' },
    { name: 'Class fill promo', trigger: 'class_booking_below_50pct', channel: 'email', urgency: 'medium' },
  ],
};

const restaurantPlaybook: Playbook = {
  vertical: 'restaurant',
  display_name: 'Restaurants & Cafés',
  pain_points: [
    'Tuesday and Wednesday nights are empty, weekends overloaded',
    'No loyalty system, customers are anonymous',
    'Food costs spike but menu prices are stale',
    'Bad reviews on Google kill walk-in traffic faster than anything',
    'Delivery platforms (Uber Eats, Glovo) eat 30% margin',
  ],
  
  scan_targets: [
    { id: 'r1', query: 'restaurant reviews {city} Google rating', priority: 'high', category: 'competitor' },
    { id: 'r2', query: 'popular food trends {city} 2024', priority: 'high', category: 'trend' },
    { id: 'r3', query: 'local events festivals {city} food', priority: 'high', category: 'seasonal' },
    { id: 'r4', query: 'delivery platform commission rates UberEats Glovo', priority: 'medium', category: 'market' },
    { id: 'r5', query: 'restaurant opening closures {city}', priority: 'medium', category: 'competitor' },
  ],
  
  triggers: [
    { id: 't1', name: 'Slow night', condition: 'tuesday_wednesday_evening_empty', description: 'Predictable slow nights based on historical data' },
    { id: 't2', name: 'Bad review spike', condition: 'google_review_rating_drop_4_to_35', description: 'Google rating dropped to 3.5 or below' },
    { id: 't3', name: 'Ingredient price change', condition: 'food_cost_increase_15pct', description: 'Key ingredient costs increased significantly' },
    { id: 't4', name: 'Local event nearby', condition: 'event_within_5km_7d', description: 'Local event in walking distance within 7 days' },
  ],
  
  actions: [
    { id: 'a1', name: 'Slow night fill', channel: 'whatsapp', template_type: 'midweek_dinner_offer', priority: 'high' },
    { id: 'a2', name: 'Review response', channel: 'internal', template_type: 'google_review_response', priority: 'critical' },
    { id: 'a3', name: 'Event special', channel: 'instagram', template_type: 'event_menu_special', priority: 'high' },
    { id: 'a4', name: 'Loyalty offer', channel: 'whatsapp', template_type: 'repeat_customer_discount', priority: 'medium' },
  ],
  
  intelligence_prompt: `You are a market intelligence expert for restaurants and cafés. Focus on:
- Competitor pricing and menu trends
- Local food festivals and events calendar
- Google review patterns (what drives 1-star vs 5-star reviews)
- Delivery platform commission impact on profitability
- Emerging cuisines and dining trends in the area
- Seasonal menu opportunities`,
  
  strategy_prompt: `You are a growth strategist for restaurants. Prioritize:
- Filling slow nights without discounting brand value
- Building repeat customer loyalty (anonymous customers = no repeat)
- Managing online reputation proactively
- Maximizing local event opportunities
- Reducing delivery platform dependency`,
  
  kpis: {
    primary: ['table_turnover', 'midweek_occupancy', 'repeat_customer_rate'],
    secondary: ['avg_order_value', 'delivery_vs_dinein_ratio', 'google_rating'],
  },
  
  campaign_templates: [
    { name: 'Midweek special', trigger: 'slow_night_prediction', channel: 'whatsapp', urgency: 'high' },
    { name: 'Review response', trigger: 'bad_review_detected', channel: 'internal', urgency: 'critical' },
    { name: 'Event promo', trigger: 'local_event_7d', channel: 'instagram', urgency: 'high' },
  ],
};

const clinicPlaybook: Playbook = {
  vertical: 'clinic',
  display_name: 'Dental & Medical Clinics',
  pain_points: [
    'Appointment no-shows are straight revenue loss',
    'Patients don\'t come back for follow-ups unless chased',
    'Referral network is word-of-mouth with zero tracking',
    'Front desk staff spend half the day on phone scheduling',
    'Seasonal gaps (summer, holidays) are predictable but unmanaged',
  ],
  
  scan_targets: [
    { id: 'c1', query: 'dental clinic prices {city}', priority: 'high', category: 'competitor' },
    { id: 'c2', query: 'dental insurance changes {country}', priority: 'critical', category: 'market' },
    { id: 'c3', query: 'medical clinic reviews {city}', priority: 'high', category: 'competitor' },
    { id: 'c4', query: 'seasonal illness trends {city}', priority: 'medium', category: 'seasonal' },
    { id: 'c5', query: 'clinic technology trends AI scheduling', priority: 'medium', category: 'trend' },
  ],
  
  triggers: [
    { id: 't1', name: 'No-show risk', condition: 'appointment_no_show_history', description: 'Patient has history of no-shows or cancellations' },
    { id: 't2', name: 'Follow-up due', condition: 'treatment_plan_overdue_30d', description: 'Patient is overdue for recommended follow-up' },
    { id: 't3', name: 'Summer gap', condition: 'summer_booking_below_60pct', description: 'Summer/holiday period with below 60% bookings' },
    { id: 't4', name: 'Referral source inactive', condition: 'referral_source_90d_no_referrals', description: 'Referral partner hasn\'t sent patients in 90 days' },
  ],
  
  actions: [
    { id: 'a1', name: 'Confirmation reminder', channel: 'whatsapp', template_type: 'appointment_confirmation', priority: 'critical' },
    { id: 'a2', name: 'Follow-up recall', channel: 'whatsapp', template_type: 'treatment_recall', priority: 'high' },
    { id: 'a3', name: 'Referral thank you', channel: 'email', template_type: 'referral_thank_you', priority: 'medium' },
    { id: 'a4', name: 'Summer promo', channel: 'whatsapp', template_type: 'summer_checkup_offer', priority: 'high' },
  ],
  
  intelligence_prompt: `You are a market intelligence expert for dental and medical clinics. Focus on:
- Competitor pricing and service offerings
- Insurance and healthcare policy changes
- Review patterns for local clinics
- Seasonal illness patterns (flu season, allergy season)
- Technology trends in healthcare scheduling
- Patient acquisition cost benchmarks`,
  
  strategy_prompt: `You are a growth strategist for medical and dental clinics. Prioritize:
- Eliminating no-shows (predictive reminder timing)
- Increasing follow-up appointment compliance
- Building referral network value (without being pushy)
- Reducing front desk phone burden (automation)
- Smoothing seasonal gaps with proactive campaigns`,
  
  kpis: {
    primary: ['no_show_rate', 'follow_up_completion_rate', 'referral_count'],
    secondary: ['booking_lead_time', 'avg_revenue_per_patient', 'seasonal_variance'],
  },
  
  campaign_templates: [
    { name: 'No-show prevention', trigger: 'appointment_tomorrow_no_confirmation', channel: 'whatsapp', urgency: 'critical' },
    { name: 'Recall campaign', trigger: 'treatment_overdue_30d', channel: 'whatsapp', urgency: 'high' },
    { name: 'Referral nurture', trigger: 'referral_source_90d_inactive', channel: 'email', urgency: 'medium' },
  ],
};

const agencyPlaybook: Playbook = {
  vertical: 'agency',
  display_name: 'Freelancers & Creative Agencies',
  pain_points: [
    'Feast or famine — no pipeline visibility beyond current projects',
    'Proposals go out and disappear with no follow-up system',
    'Pricing is inconsistent, undercharging is the default',
    'Past clients represent the easiest new revenue and are completely ignored',
    'Social proof (case studies, testimonials) exists but never gets published',
  ],
  
  scan_targets: [
    { id: 'a1', query: 'freelance rate trends {specialty} 2024', priority: 'high', category: 'market' },
    { id: 'a2', query: 'client industries growing {city}', priority: 'high', category: 'market' },
    { id: 'a3', query: 'creative agency pricing models', priority: 'medium', category: 'competitor' },
    { id: 'a4', query: 'project management tools trends', priority: 'medium', category: 'trend' },
  ],
  
  triggers: [
    { id: 't1', name: 'Pipeline gap', condition: 'pipeline_below_4_weeks', description: 'Pipeline has less than 4 weeks of work' },
    { id: 't2', name: 'Proposal cold', condition: 'proposal_sent_7d_no_response', description: 'Proposal sent 7+ days ago with no response' },
    { id: 't3', name: 'Past client anniversary', condition: 'project_completed_6mo_ago', description: '6 months since last project with client' },
    { id: 't4', name: 'Underpricing risk', condition: 'new_project_below_minimum_rate', description: 'New project offered below minimum rate' },
  ],
  
  actions: [
    { id: 'a1', name: 'Pipeline alert', channel: 'internal', template_type: 'pipeline_warning', priority: 'critical' },
    { id: 'a2', name: 'Proposal follow-up', channel: 'email', template_type: 'proposal_followup', priority: 'high' },
    { id: 'a3', name: 'Past client reactivation', channel: 'email', template_type: 'past_client_checkin', priority: 'high' },
    { id: 'a4', name: 'Rate justification', channel: 'internal', template_type: 'rate_calculator', priority: 'medium' },
  ],
  
  intelligence_prompt: `You are a market intelligence expert for freelancers and creative agencies. Focus on:
- Industry rate trends and benchmarks
- Growing client industries and verticals
- Competitor positioning and pricing models
- Productivity tools and AI impact on freelance work
- Remote work and global talent competition`,
  
  strategy_prompt: `You are a growth strategist for freelancers and agencies. Prioritize:
- Maintaining consistent pipeline (not feast/famine)
- Follow-up discipline for proposals
- Consistent pricing that reflects value
- Reactivating past clients (lowest cost acquisition)
- Publishing social proof (case studies = credibility)`,
  
  kpis: {
    primary: ['pipeline_weeks', 'proposal_conversion_rate', 'repeat_client_rate'],
    secondary: ['avg_project_value', 'lead_response_time_hours', 'proposal_close_time'],
  },
  
  campaign_templates: [
    { name: 'Pipeline alert', trigger: 'pipeline_below_4_weeks', channel: 'internal', urgency: 'critical' },
    { name: 'Proposal nudge', trigger: 'proposal_7d_no_response', channel: 'email', urgency: 'high' },
    { name: 'Past client reach', trigger: '6mo_since_project', channel: 'email', urgency: 'high' },
  ],
};

const realestatePlaybook: Playbook = {
  vertical: 'realestate',
  display_name: 'Real Estate Agents',
  pain_points: [
    'Listings go cold after 2 weeks with no strategy shift',
    'Leads from Zillow/portals are low quality but get the same attention as hot leads',
    'Market timing intelligence — when to push, when to wait — is pure gut feel',
    'Past clients are untouched goldmines for referrals',
    'Social content is either zero or lazy property photos',
  ],
  
  scan_targets: [
    { id: 're1', query: 'housing market trends {city} 2024', priority: 'critical', category: 'market' },
    { id: 're2', query: 'new listings {neighborhood} {city}', priority: 'high', category: 'competitor' },
    { id: 're3', query: 'interest rate changes {country}', priority: 'critical', category: 'market' },
    { id: 're4', query: 'neighborhood developments {city}', priority: 'high', category: 'trend' },
    { id: 're5', query: 'Zillow competitor portal leads {city}', priority: 'medium', category: 'competitor' },
  ],
  
  triggers: [
    { id: 't1', name: 'Listing cold', condition: 'listing_no_views_14d', description: 'Listing has had no views for 14+ days' },
    { id: 't2', name: 'Lead hot signal', condition: 'lead_viewed_3_plus_listings', description: 'Lead has viewed 3+ listings (high interest)' },
    { id: 't3', name: 'Market timing', condition: 'seasonal_market_shift', description: 'Market entering active/slow season' },
    { id: 't4', name: 'Referral window', condition: 'client_anniversary_closing_date', description: 'Anniversary of past transaction (referral timing)' },
  ],
  
  actions: [
    { id: 'a1', name: 'Price reduction strategy', channel: 'internal', template_type: 'listing_repricing', priority: 'high' },
    { id: 'a2', name: 'Hot lead priority', channel: 'whatsapp', template_type: 'hot_lead_followup', priority: 'critical' },
    { id: 'a3', name: 'Past client check-in', channel: 'whatsapp', template_type: 'past_client_referral_ask', priority: 'medium' },
    { id: 'a4', name: 'Market update newsletter', channel: 'email', template_type: 'market_update_newsletter', priority: 'medium' },
  ],
  
  intelligence_prompt: `You are a market intelligence expert for real estate agents. Focus on:
- Housing market trends and price movements
- Interest rate changes and buyer sentiment
- Neighborhood development and gentrification patterns
- Portal lead quality and conversion benchmarks
- Seasonal market timing patterns
- New construction and inventory changes`,
  
  strategy_prompt: `You are a growth strategist for real estate agents. Prioritize:
- Keeping listings fresh (price adjustments, new photos, descriptions)
- Lead scoring by actual buying signals (not gut feel)
- Past client relationship maintenance (referral goldmine)
- Market timing decisions (when to push offers, when to wait)
- Social content that demonstrates expertise, not just listings`,
  
  kpis: {
    primary: ['listing_days_on_market', 'lead_conversion_rate', 'referral_count'],
    secondary: ['offer_to_list_ratio', 'pipeline_value', 'past_client_reactivation_rate'],
  },
  
  campaign_templates: [
    { name: 'Listing refresh', trigger: 'listing_14d_no_views', channel: 'internal', urgency: 'high' },
    { name: 'Hot lead alert', trigger: 'lead_3_plus_viewings', channel: 'whatsapp', urgency: 'critical' },
    { name: 'Market update', trigger: 'monthly_digest', channel: 'email', urgency: 'medium' },
  ],
};

const hotelPlaybook: Playbook = {
  vertical: 'hotel',
  display_name: 'Boutique Hotels & Airbnbs',
  pain_points: [
    'Pricing is static when it should be dynamic by season and local events',
    'Direct bookings are falling while OTA commissions eat margin',
    'Guest reviews are not being systematically leveraged',
    'Local event calendar is not being used to drive demand',
    'Repeat guests exist but are never specifically targeted',
  ],
  
  scan_targets: [
    { id: 'h1', query: 'local events calendar {city} upcoming', priority: 'critical', category: 'seasonal' },
    { id: 'h2', query: 'hotel pricing {location} {dates}', priority: 'high', category: 'competitor' },
    { id: 'h3', query: 'airbnb occupancy rates {city}', priority: 'high', category: 'market' },
    { id: 'h4', query: 'OTA commission rates 2024', priority: 'medium', category: 'market' },
    { id: 'h5', query: 'travel trends {country} 2024', priority: 'medium', category: 'trend' },
  ],
  
  triggers: [
    { id: 't1', name: 'Event nearby', condition: 'major_event_30d_out', description: 'Major event within 30-day window' },
    { id: 't2', name: 'Low occupancy forecast', condition: 'occupancy_below_60pct_7d', description: 'Next 7 days below 60% occupancy' },
    { id: 't3', name: 'Good review received', condition: 'new_5star_review', description: 'New 5-star review received' },
    { id: 't4', name: 'Repeat guest window', condition: 'guest_last_stay_6mo_ago', description: 'Repeat guest window (6 months since last stay)' },
  ],
  
  actions: [
    { id: 'a1', name: 'Dynamic pricing update', channel: 'internal', template_type: 'price_adjustment_suggestion', priority: 'critical' },
    { id: 'a2', name: 'Direct booking push', channel: 'email', template_type: 'direct_booking_incentive', priority: 'high' },
    { id: 'a3', name: 'Review promotion', channel: 'whatsapp', template_type: 'review_social_share', priority: 'medium' },
    { id: 'a4', name: 'Event special package', channel: 'whatsapp', template_type: 'event_package_offer', priority: 'high' },
  ],
  
  intelligence_prompt: `You are a market intelligence expert for boutique hotels and vacation rentals. Focus on:
- Local events calendar and demand drivers
- Competitor pricing and occupancy strategies
- OTA commission impact on profitability
- Direct booking conversion tactics
- Travel trends and seasonal demand patterns
- Guest review patterns and reputation management`,
  
  strategy_prompt: `You are a growth strategist for hotels and Airbnbs. Prioritize:
- Dynamic pricing based on events and demand signals
- Reducing OTA commission dependency (direct booking focus)
- Systematic review generation and promotion
- Local event leverage for demand creation
- Repeat guest targeting (lowest cost acquisition)`,
  
  kpis: {
    primary: ['occupancy_rate', 'revpar', 'direct_booking_ratio'],
    secondary: ['avg_daily_rate', 'repeat_guest_rate', 'review_score'],
  },
  
  campaign_templates: [
    { name: 'Event pricing', trigger: 'major_event_30d', channel: 'whatsapp', urgency: 'critical' },
    { name: 'Direct booking push', trigger: 'ota_booking_detected', channel: 'email', urgency: 'high' },
    { name: 'Repeat guest offer', trigger: '6mo_since_last_stay', channel: 'whatsapp', urgency: 'medium' },
  ],
};

const ecommercePlaybook: Playbook = {
  vertical: 'ecommerce',
  display_name: 'E-commerce Stores (Small Independents)',
  pain_points: [
    'Cart abandonment with no recovery sequence',
    'Ad spend goes up but ROAS tracking is manual and delayed',
    'Inventory decisions are gut feel, not demand signal',
    'Email list exists but gets blasted the same message to everyone',
    'Seasonal opportunities missed because planning starts too late',
  ],
  
  scan_targets: [
    { id: 'e1', query: 'ecommerce trends {niche} 2024', priority: 'high', category: 'market' },
    { id: 'e2', query: 'product demand forecasting {category}', priority: 'high', category: 'trend' },
    { id: 'e3', query: 'shopping cart abandonment rates industry', priority: 'medium', category: 'market' },
    { id: 'e4', query: 'seasonal shopping patterns {country}', priority: 'critical', category: 'seasonal' },
  ],
  
  triggers: [
    { id: 't1', name: 'Cart abandoned', condition: 'cart_abandoned_1h', description: 'Customer abandoned cart after 1 hour' },
    { id: 't2', name: 'Inventory low', condition: 'stock_below_20_units', description: 'Product stock below 20 units' },
    { id: 't3', name: 'Seasonal gap', condition: 'no_upcoming_promo_planned', description: 'No seasonal campaign planned for 30+ days' },
    { id: 't4', name: 'High-value browse', condition: 'browsed_3_plus_high_margin', description: 'Customer browsed 3+ high-margin products' },
  ],
  
  actions: [
    { id: 'a1', name: 'Cart recovery', channel: 'email', template_type: 'cart_abandonment_email', priority: 'critical' },
    { id: 'a2', name: 'Reorder reminder', channel: 'email', template_type: 'reorder_reminder', priority: 'high' },
    { id: 'a3', name: 'Inventory reorder alert', channel: 'internal', template_type: 'reorder_suggestion', priority: 'high' },
    { id: 'a4', name: 'Segmented campaign', channel: 'email', template_type: 'personalized_offer', priority: 'medium' },
  ],
  
  intelligence_prompt: `You are a market intelligence expert for small e-commerce stores. Focus on:
- Product demand trends and seasonality
- Shopping cart abandonment patterns
- Competitor pricing and promotion strategies
- Email marketing benchmarks by industry
- Inventory and supply chain trends
- Customer acquisition cost benchmarks`,
  
  strategy_prompt: `You are a growth strategist for e-commerce stores. Prioritize:
- Cart abandonment recovery (highest ROI email sequence)
- Inventory demand forecasting (never miss sales, never overstock)
- Customer segmentation for personalized campaigns
- ROAS tracking and optimization
- Seasonal planning (start early, not last minute)`,
  
  kpis: {
    primary: ['cart_abandonment_recovery_rate', 'customer_lifetime_value', 'email_campaign_roi'],
    secondary: ['average_order_value', 'repeat_purchase_rate', 'email_list_growth'],
  },
  
  campaign_templates: [
    { name: 'Cart recovery', trigger: 'cart_abandoned_1h', channel: 'email', urgency: 'critical' },
    { name: 'Reorder flow', trigger: 'last_purchase_45d_ago', channel: 'email', urgency: 'high' },
    { name: 'Seasonal prep', trigger: '60d_to_season', channel: 'email', urgency: 'high' },
  ],
};

const autorepairPlaybook: Playbook = {
  vertical: 'autorepair',
  display_name: 'Auto Repair Shops',
  pain_points: [
    'Seasonal demand (winter tires, AC service) is predictable but not leveraged',
    'Customers come once, get fixed, never hear from the shop again',
    'Parts pricing vs. labor split is opaque, margins are guessed',
    'Online reputation is everything for local search and it\'s unmanaged',
    'Fleet clients (small businesses with vans) are high value but hard to find',
  ],
  
  scan_targets: [
    { id: 'ar1', query: 'auto repair shop reviews {city}', priority: 'high', category: 'competitor' },
    { id: 'ar2', query: 'seasonal car maintenance needs {region}', priority: 'critical', category: 'seasonal' },
    { id: 'ar3', query: 'fleet vehicle management {city}', priority: 'medium', category: 'market' },
    { id: 'ar4', query: 'car parts price changes 2024', priority: 'medium', category: 'market' },
  ],
  
  triggers: [
    { id: 't1', name: 'Seasonal service window', condition: 'winter_tires_season_30d', description: '30 days before winter tire season' },
    { id: 't2', name: 'Customer dormant', condition: 'vehicle_12mo_no_service', description: 'Customer\'s vehicle hasn\'t been serviced in 12 months' },
    { id: 't3', name: 'Review needed', condition: 'service_completed_7d_ago', description: '7 days since completed service' },
    { id: 't4', name: 'Fleet opportunity', condition: 'local_business_10_plus_vehicles', description: 'Local business with 10+ fleet vehicles' },
  ],
  
  actions: [
    { id: 'a1', name: 'Seasonal campaign', channel: 'whatsapp', template_type: 'seasonal_service_reminder', priority: 'critical' },
    { id: 'a2', name: 'Maintenance check-in', channel: 'whatsapp', template_type: 'vehicle_maintenance_check', priority: 'high' },
    { id: 'a3', name: 'Review request', channel: 'whatsapp', template_type: 'review_request_after_service', priority: 'high' },
    { id: 'a4', name: 'Fleet outreach', channel: 'email', template_type: 'fleet_service_proposal', priority: 'medium' },
  ],
  
  intelligence_prompt: `You are a market intelligence expert for auto repair shops. Focus on:
- Competitor pricing and service offerings
- Seasonal maintenance patterns (tires, AC, inspections)
- Fleet management and B2B opportunities
- Car parts and labor cost trends
- Online reputation impact on local search
- Vehicle age patterns in local market`,
  
  strategy_prompt: `You are a growth strategist for auto repair shops. Prioritize:
- Seasonal campaign timing (tires, AC, holidays)
- Customer lifecycle management (not a one-time transaction)
- Margin visibility (parts vs. labor pricing)
- Online reputation management
- Fleet client acquisition (high value, long term)`,
  
  kpis: {
    primary: ['repeat_customer_rate', 'seasonal_campaign_roi', 'fleet_client_revenue'],
    secondary: ['avg_invoice_value', 'service_category_mix', 'online_review_score'],
  },
  
  campaign_templates: [
    { name: 'Seasonal tire push', trigger: 'winter_tires_30d', channel: 'whatsapp', urgency: 'critical' },
    { name: 'Maintenance recall', trigger: '12mo_no_service', channel: 'whatsapp', urgency: 'high' },
    { name: 'Fleet pitch', trigger: 'quarterly_fleet_outreach', channel: 'email', urgency: 'medium' },
  ],
};

const lawPlaybook: Playbook = {
  vertical: 'law',
  display_name: 'Law Firms (Small)',
  pain_points: [
    'Lead follow-up is slow — potential clients shop 3-4 firms simultaneously, first to respond wins',
    'Referral sources (accountants, realtors) are not being nurtured systematically',
    'Website generates inquiries that fall into a black hole',
    'No system to track which case types are most profitable',
    'Client communication during cases is reactive, not proactive',
  ],
  
  scan_targets: [
    { id: 'l1', query: 'law firm marketing trends {city}', priority: 'high', category: 'market' },
    { id: 'l2', query: 'legal technology AI tools 2024', priority: 'medium', category: 'trend' },
    { id: 'l3', query: 'referral partner programs accountants {city}', priority: 'high', category: 'market' },
  ],
  
  triggers: [
    { id: 't1', name: 'Lead cold', condition: 'website_lead_24h_no_response', description: 'Website lead without response in 24 hours' },
    { id: 't2', name: 'Referral dormant', condition: 'referral_partner_60d_no_referrals', description: 'Referral partner hasn\'t sent leads in 60 days' },
    { id: 't3', name: 'Case milestone', condition: 'case_30d_no_update', description: 'Case has had no client update in 30 days' },
  ],
  
  actions: [
    { id: 'a1', name: 'Speed-to-lead alert', channel: 'internal', template_type: 'lead_response_priority', priority: 'critical' },
    { id: 'a2', name: 'Referral partner check-in', channel: 'email', template_type: 'referral_partner_nurture', priority: 'high' },
    { id: 'a3', name: 'Client update reminder', channel: 'internal', template_type: 'case_status_update', priority: 'high' },
  ],
  
  intelligence_prompt: `You are a market intelligence expert for small law firms. Focus on:
- Legal marketing and client acquisition trends
- Referral network opportunities (accountants, realtors, wealth managers)
- Legal technology and AI tools
- Case type profitability patterns
- Client communication expectations`,
  
  strategy_prompt: `You are a growth strategist for small law firms. Prioritize:
- Speed-to-lead (first responder wins)
- Referral partner systematic nurturing
- Case type profitability tracking
- Proactive client communication
- Conversion rate optimization for website leads`,
  
  kpis: {
    primary: ['lead_response_time', 'referral_conversion_rate', 'case_profitability'],
    secondary: ['website_conversion_rate', 'client_retention_rate', 'avg_case_value'],
  },
  
  campaign_templates: [
    { name: 'Speed alert', trigger: 'new_lead_no_24h_response', channel: 'internal', urgency: 'critical' },
    { name: 'Referral nurture', trigger: '60d_no_referrals', channel: 'email', urgency: 'high' },
    { name: 'Client update', trigger: '30d_case_no_contact', channel: 'internal', urgency: 'high' },
  ],
};

// ─── Playbook Registry ────────────────────────────────────────────────────────

const PLAYBOOKS: Record<Vertical, Playbook> = {
  salon: salonPlaybook,
  gym: gymPlaybook,
  restaurant: restaurantPlaybook,
  clinic: clinicPlaybook,
  agency: agencyPlaybook,
  realestate: realestatePlaybook,
  hotel: hotelPlaybook,
  ecommerce: ecommercePlaybook,
  autorepair: autorepairPlaybook,
  law: lawPlaybook,
};

// ─── Default Playbook (fallback) ─────────────────────────────────────────────

const defaultPlaybook: Playbook = {
  vertical: 'salon',
  display_name: 'General Business',
  pain_points: [
    'Finding new customers',
    'Keeping existing customers',
    'Knowing what\'s actually working',
  ],
  
  scan_targets: [
    { id: 'd1', query: 'competitor pricing {city}', priority: 'high', category: 'competitor' },
    { id: 'd2', query: 'market trends {industry}', priority: 'high', category: 'market' },
    { id: 'd3', query: 'industry news {industry}', priority: 'medium', category: 'trend' },
  ],
  
  triggers: [
    { id: 't1', name: 'Slow period', condition: 'low_activity_week', description: 'Week with below average activity' },
  ],
  
  actions: [
    { id: 'a1', name: 'Re-engagement', channel: 'whatsapp', template_type: 'general_reengagement', priority: 'medium' },
  ],
  
  intelligence_prompt: `You are a market intelligence expert. Focus on:
- Competitor analysis and pricing
- Market trends and opportunities
- Industry news and developments
- Customer insights and behavior patterns`,
  
  strategy_prompt: `You are a business growth strategist. Prioritize:
- Finding new customers efficiently
- Retaining existing customers
- Measuring and optimizing marketing ROI`,
  
  kpis: {
    primary: ['customer_acquisition_cost', 'customer_lifetime_value', 'marketing_roi'],
    secondary: ['conversion_rate', 'repeat_purchase_rate', 'net_promoter_score'],
  },
  
  campaign_templates: [
    { name: 'General promo', trigger: 'low_activity', channel: 'whatsapp', urgency: 'medium' },
  ],
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get playbook for a specific vertical.
 */
export function getPlaybook(vertical: Vertical | string): Playbook {
  return PLAYBOOKS[vertical as Vertical] || defaultPlaybook;
}

/**
 * Get scan targets with interpolated variables.
 */
export function getPlaybookScanTargets(
  playbook: Playbook,
  context: { city?: string; location?: string; region?: string; [key: string]: string | undefined }
): string[] {
  return playbook.scan_targets.map(target => {
    let query = target.query;
    for (const [key, value] of Object.entries(context)) {
      if (value) {
        query = query.replace(new RegExp(`{${key}}`, 'gi'), value);
      }
    }
    return query;
  });
}

/**
 * Get relevant triggers for a vertical.
 */
export function getPlaybookTriggers(vertical: Vertical | string): PlaybookTrigger[] {
  return getPlaybook(vertical).triggers;
}

/**
 * Get campaign templates for a vertical.
 */
export function getPlaybookCampaigns(vertical: Vertical | string) {
  return getPlaybook(vertical).campaign_templates;
}

/**
 * Inject vertical-specific context into research prompt.
 */
export function buildResearchPrompt(
  task: string,
  vertical: Vertical | string,
  businessContext: {
    name?: string;
    city?: string;
    location?: string;
    [key: string]: any;
  }
): string {
  const playbook = getPlaybook(vertical);
  
  const contextVars = {
    city: businessContext.city || 'Unknown',
    location: businessContext.location || businessContext.city || 'Unknown',
    region: businessContext.region || businessContext.city || 'Unknown',
  };
  
  const scanTargets = playbook.scan_targets
    .filter(s => s.priority === 'critical' || s.priority === 'high')
    .map(s => {
      let query = s.query;
      for (const [key, value] of Object.entries(contextVars)) {
        query = query.replace(new RegExp(`{${key}}`, 'gi'), value as string);
      }
      return query;
    })
    .join('\n');
  
  return `${playbook.intelligence_prompt}

Business: ${businessContext.name || 'Unknown'}
Vertical: ${playbook.display_name}

Key pain points for this vertical:
${playbook.pain_points.map(p => `- ${p}`).join('\n')}

Priority intelligence targets:
${scanTargets}

Task: ${task}

Provide structured findings with sources and suggested actions.`;
}

/**
 * Inject vertical-specific context into strategy prompt.
 */
export function buildStrategyPrompt(
  task: string,
  vertical: Vertical | string,
  businessContext: {
    name?: string;
    type?: string;
    city?: string;
    [key: string]: any;
  },
  researchFindings?: { summary?: string; findings?: any[] }
): string {
  const playbook = getPlaybook(vertical);
  
  const researchContext = researchFindings?.summary
    ? `\n\nResearch findings:\n${researchFindings.summary}\n\nKey findings:\n${researchFindings.findings?.map((f: any) => `- ${f.title}: ${f.description}`).join('\n') || 'None'}`
    : '';
  
  return `${playbook.strategy_prompt}

Business: ${businessContext.name || 'Unknown'}
Type: ${playbook.display_name}

Strategic priorities for this vertical:
${playbook.kpis.primary.map(k => `- ${k}`).join('\n')}

Current task: ${task}${researchContext}

Generate recommendations with clear rationale and action plans.`;
}

// ─── Vertical List for UI ────────────────────────────────────────────────────

export const VERTICAL_LIST = Object.entries(PLAYBOOKS).map(([key, playbook]) => ({
  value: key,
  label: playbook.display_name,
  pain_points: playbook.pain_points,
}));

// Export all playbooks
export { salonPlaybook, gymPlaybook, restaurantPlaybook, clinicPlaybook, agencyPlaybook, realestatePlaybook, hotelPlaybook, ecommercePlaybook, autorepairPlaybook, lawPlaybook };