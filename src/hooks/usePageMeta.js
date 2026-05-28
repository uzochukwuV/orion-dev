import { useLocation } from 'react-router-dom';

const pageMeta = {
  '/': { title: 'Command Center', subtitle: 'Your business at a glance' },
  '/intelligence': { title: 'Market Intelligence', subtitle: 'Live opportunities from the web' },
  '/campaigns': { title: 'Campaigns', subtitle: 'AI-powered marketing actions' },
  '/leads': { title: 'Leads & CRM', subtitle: 'Contacts, follow-ups, and pipeline' },
  '/social': { title: 'Social Media', subtitle: 'Content, scheduling, and engagement' },
  '/agents': { title: 'AI Agents', subtitle: 'Automated workflows running for you' },
  '/analytics': { title: 'Analytics', subtitle: 'Revenue, growth, and performance' },
  '/settings': { title: 'Settings', subtitle: 'Business profile, integrations, billing' },
};

export function usePageMeta() {
  const location = useLocation();
  return pageMeta[location.pathname] || { title: 'Orion', subtitle: '' };
}