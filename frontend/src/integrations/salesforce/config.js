import config from '@/config';

export default {
  enabled: config.isSalesforceIntegrationEnabled,
  hideAsIntegration: !config.isSalesforceIntegrationEnabled,
  name: 'Salesforce',
  description: 'Create a 2-way sync with your Salesforce CRM.',
  image:
    '/images/integrations/salesforce.png',
  enterprise: true,
};
