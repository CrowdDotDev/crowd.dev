import config from '@/config';

export default {
  enabled: config.isCensusIntegrationEnabled,
  hideAsIntegration: !config.isCensusIntegrationEnabled,
  name: 'Census',
  description: 'Use Census Reverse ETL to send customer data to crowd.dev.',
  image:
      '/images/integrations/census.png',
  enterprise: true,
};
