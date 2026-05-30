/**
 * Sample Data Seeder
 * 
 * Creates a sample restaurant business with realistic test data
 * for frontend development and testing.
 * 
 * Run: npx tsx src/seed.ts
 */

import { connectDB } from './db/connection.js';
import { UserModel } from './db/models/User.js';
import { BusinessModel } from './db/models/Business.js';
import { LeadModel } from './db/models/Lead.js';
import { CampaignModel } from './db/models/Campaign.js';
import { OpportunityModel } from './db/models/Opportunity.js';
import { SocialPostModel } from './db/models/SocialPost.js';

async function seed() {
  console.log('🌱 Seeding sample data...\n');

  await connectDB();

  // ─── Clean existing sample data ───────────────────────────────────────────
  console.log('Cleaning existing sample data...');
  await UserModel.deleteMany({ email: { $in: ['demo@lacucina.pl', 'test@example.com'] } });
  await BusinessModel.deleteMany({ owner_email: 'demo@lacucina.pl' });
  await LeadModel.deleteMany({ business_id: { $ne: 'demo' } });
  await CampaignModel.deleteMany({ business_id: { $ne: 'demo' } });
  await OpportunityModel.deleteMany({ business_id: { $ne: 'demo' } });
  await SocialPostModel.deleteMany({ business_id: { $ne: 'demo' } });

  // ─── Create User ─────────────────────────────────────────────────────────────
  console.log('Creating user...');
  const user = await UserModel.create({
    email: 'demo@lacucina.pl',
    password_hash: 'password123',  // Will be hashed
    name: 'Maria Kowalski',
    plan: 'growth',
    email_verified: true,
    settings: {
      notifications_enabled: true,
      email_digest: 'weekly',
    },
  });
  console.log(`  ✓ User: ${user.email}`);

  // ─── Create Business ──────────────────────────────────────────────────────────
  console.log('Creating restaurant...');
  const business = await BusinessModel.create({
    user_id: user._id,
    name: 'La Cucina',
    type: 'restaurant',
    owner_email: 'demo@lacucina.pl',
    address: 'ul. Floriańska 15',
    city: 'Kraków',
    phone: '+48 12 421 5555',
    website: 'https://lacucina.pl',
    description: 'Authentic Italian restaurant in the heart of Kraków. Family-owned since 2008, serving traditional dishes from Naples with modern touches.',
    plan: 'growth',
    plan_status: 'active',
    onboarding_complete: true,
    instagram_connected: true,
    google_business_connected: true,
    target_audience: 'Food lovers aged 25-55, tourists, special occasions',
    main_services: ['Italian cuisine', 'Pasta making', 'Wine pairing', 'Private dining'],
    competitors: ['Mamma Mia', 'Trattoria Vecchia', 'Napoli Express'],
    monthly_revenue_goal: 85000,
    location: 'Kraków, Poland',
    region: 'Małopolskie',
  });

  // Link business to user
  user.business_id = business._id;
  await user.save();
  console.log(`  ✓ Business: ${business.name} (${business.city})`);

  // ─── Create Leads ────────────────────────────────────────────────────────────
  console.log('Creating leads...');
  const leads = await LeadModel.create([
    {
      business_id: business._id.toString(),
      name: 'Piotr Nowak',
      email: 'piotr.nowak@techcorp.pl',
      phone: '+48 601 234 567',
      source: 'website_form',
      status: 'new',
      notes: 'Interested in corporate lunch program for 20+ employees. Budget ~5000 PLN/month.',
      value_estimate: 6000,
    },
    {
      business_id: business._id.toString(),
      name: 'Anna Wiśniewska',
      email: 'anna.w@designstudio.pl',
      phone: '+48 602 345 678',
      source: 'social_dm',
      status: 'contacted',
      notes: 'Looking for private dining for 12 people for her birthday. End of June.',
      value_estimate: 1500,
    },
    {
      business_id: business._id.toString(),
      name: 'Michał Kowalczyk',
      email: 'mkowalczyk@lawfirm.pl',
      source: 'referral',
      status: 'qualified',
      notes: 'Partner at local law firm. Looking for regular client entertainment dining.',
      value_estimate: 3000,
    },
    {
      business_id: business._id.toString(),
      name: 'Katarzyna Zielińska',
      email: 'kasia@marketing.pl',
      source: 'google',
      status: 'new',
      notes: 'Found us on Google. Looking for anniversary dinner for 4 people.',
      value_estimate: 800,
    },
    {
      business_id: business._id.toString(),
      name: 'Tomasz Wójcik',
      email: 'tomasz.wojcik@startup.pl',
      source: 'facebook',
      status: 'contacted',
      notes: 'Startup founder, interested in hosting team events. 15-20 people monthly.',
      value_estimate: 5000,
    },
  ]);
  console.log(`  ✓ ${leads.length} leads created`);

  // ─── Create Campaigns ─────────────────────────────────────────────────────────
  console.log('Creating campaigns...');
  const campaigns = await CampaignModel.create([
    {
      business_id: business._id.toString(),
      name: 'Weekend Brunch Special',
      type: 'email',
      status: 'active',
      target_audience: 'Local food lovers, age 25-45',
      headline: 'Weekend Brunch at La Cucina',
      body_copy: 'Promote our new weekend brunch menu featuring eggs Benedict, fresh pastries, and bottomless coffee.',
      start_date: new Date('2024-06-01'),
      end_date: new Date('2024-06-30'),
      budget: 500,
      ai_generated: true,
      impressions: 1250,
      clicks: 438,
      conversions: 12,
      revenue_attributed: 1800,
    },
    {
      business_id: business._id.toString(),
      name: 'Summer Wine & Dine',
      type: 'instagram',
      status: 'pending_review',
      target_audience: 'Couples, special occasions, tourists',
      headline: 'Summer Wine & Dine',
      body_copy: 'Seasonal campaign featuring summer wines paired with our signature dishes. Rooftop dining photos.',
      start_date: new Date('2024-07-01'),
      end_date: new Date('2024-08-31'),
      budget: 800,
      ai_generated: true,
    },
    {
      business_id: business._id.toString(),
      name: 'Tuesday Pasta Night',
      type: 'promotion',
      status: 'active',
      target_audience: 'Regular customers, local residents',
      headline: '20% Off All Pasta - Tuesdays Only!',
      body_copy: 'Every Tuesday 20% off all pasta dishes. Sometimes the mid-week blues need a bowl of comfort.',
      start_date: new Date('2024-05-01'),
      budget: 100,
      ai_generated: true,
      impressions: 320,
      clicks: 285,
      conversions: 45,
      revenue_attributed: 3600,
    },
    {
      business_id: business._id.toString(),
      name: 'Corporate Catering',
      type: 'email',
      status: 'draft',
      target_audience: 'Local businesses, companies with 20+ employees',
      headline: 'Corporate Catering at La Cucina',
      body_copy: 'Target nearby offices with catering proposals for team lunches and events.',
      start_date: new Date('2024-07-15'),
      budget: 300,
      ai_generated: true,
    },
  ]);
  console.log(`  ✓ ${campaigns.length} campaigns created`);

  // ─── Create Opportunities ─────────────────────────────────────────────────────
  console.log('Creating opportunities...');
  const opportunities = await OpportunityModel.create([
    {
      business_id: business._id.toString(),
      title: 'Kraków Food Festival - August',
      description: 'Annual Kraków Food Festival in Rynek Główny. High foot traffic, potential to showcase signature dishes to 5000+ visitors.',
      category: 'seasonal',
      source: 'research_agent',
      impact_score: 8,
      urgency: 'high',
      status: 'new',
      suggested_action: 'Apply for vendor spot or partner with festival organizers for cross-promotion.',
    },
    {
      business_id: business._id.toString(),
      title: 'Mamma Mia Competition Analysis',
      description: 'Mamma Mia (competitor) recently launched 15% student discount on weekdays. May affect our target demographic.',
      category: 'competitor',
      source: 'research_agent',
      impact_score: 6,
      urgency: 'medium',
      status: 'new',
      suggested_action: 'Consider similar student discount or target universities with flyers.',
    },
    {
      business_id: business._id.toString(),
      title: 'Plant-Based Menu Trend',
      description: 'Growing demand for plant-based options in Kraków restaurants. Chefs report 40% increase in vegan requests.',
      category: 'trend',
      source: 'research_agent',
      impact_score: 7,
      urgency: 'medium',
      status: 'reviewed',
      suggested_action: 'Add 2-3 plant-based pasta options to menu. Market as "La Cucina Verde" sub-brand.',
    },
    {
      business_id: business._id.toString(),
      title: 'Tuesday Night Gap Analysis',
      description: 'Data shows Tuesday occupancy at 35% vs. Friday/Saturday at 85%. Significant revenue opportunity.',
      category: 'gap',
      source: 'internal',
      impact_score: 9,
      urgency: 'high',
      status: 'acted_on',
      suggested_action: 'Implemented Tuesday Pasta Night campaign (see campaigns). Tracking results.',
    },
    {
      business_id: business._id.toString(),
      title: 'Tourist Season Peak - July',
      description: 'Historical data shows July brings 60% more tourists than January. Price optimization opportunity.',
      category: 'seasonal',
      source: 'research_agent',
      impact_score: 7,
      urgency: 'high',
      status: 'new',
      suggested_action: 'Adjust pricing for July. Add premium "Tourist Menu" with English descriptions and wine pairing.',
    },
  ]);
  console.log(`  ✓ ${opportunities.length} opportunities created`);

  // ─── Create Social Posts ──────────────────────────────────────────────────────
  console.log('Creating social posts...');
  const posts = await SocialPostModel.create([
    {
      business_id: business._id.toString(),
      content: '🍝 Our handmade tagliatelle is flying out the kitchen! Fresh daily, always al dente. Who\'s coming in for a taste? 📍 ul. Floriańska 15\n.\n.\n.\n#lacucinakrakow #handmadepasta #italianfood #krakowfoodie',
      platform: 'instagram',
      status: 'published',
      scheduled_date: new Date('2024-05-28'),
      published_date: new Date('2024-05-28'),
      metrics: {
        likes: 234,
        comments: 18,
        shares: 12,
        reach: 1850,
      },
    },
    {
      business_id: business._id.toString(),
      content: '🍷 TUESDAY SPECIAL: 20% off ALL pasta dishes! Sometimes the mid-week blues need a bowl of comfort. Join us tonight!',
      platform: 'instagram',
      status: 'published',
      published_date: new Date('2024-05-28'),
      metrics: {
        likes: 156,
        comments: 8,
        shares: 5,
        reach: 1200,
      },
    },
    {
      business_id: business._id.toString(),
      content: '🍝 New on the menu! Truffle mushroom risotto - creamy arborio rice with wild mushrooms and black truffle shavings. Available from Friday. Reserve your table → lacucina.pl',
      platform: 'instagram',
      status: 'scheduled',
      scheduled_date: new Date('2024-06-07'),
      metrics: {},
    },
    {
      business_id: business._id.toString(),
      content: '🎉 PRIVATE EVENTS: Planning a birthday, anniversary, or corporate gathering? Our private dining room seats 20 and we offer custom menus. DM us for details!',
      platform: 'instagram',
      status: 'draft',
      metrics: {},
    },
  ]);
  console.log(`  ✓ ${posts.length} social posts created`);

  console.log('\n✅ Sample data seeded successfully!\n');
  console.log('=== Test Credentials ===');
  console.log('Email: demo@lacucina.pl');
  console.log('Password: password123');
  console.log('Business: La Cucina (Restaurant in Kraków)');
  console.log('========================\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});